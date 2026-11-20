"""Registration service – register, cancel, waitlist management."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    CapacityFullError,
    ConflictError,
    EligibilityError,
    NotFoundError,
    RegistrationClosedError,
    ValidationError,
)
from app.core.config import get_settings
from app.models.event import Event, EventStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.student import Student
from app.services.event_service import check_event_eligibility

settings = get_settings()


async def register_for_event(
    student_id: uuid.UUID, event_id: uuid.UUID, db: AsyncSession
) -> Registration:
    """Register a student for an event with all validation checks."""
    # Load student
    student = await db.get(Student, student_id)
    if not student:
        raise NotFoundError("Student")

    # Load event with relationships
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.organizer), selectinload(Event.category), selectinload(Event.venue))
        .where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise NotFoundError("Event", str(event_id))

    # Status checks
    if event.status != EventStatus.published:
        raise RegistrationClosedError("This event is not open for registration")

    if hasattr(event, "is_registration_open") and not event.is_registration_open:
        raise RegistrationClosedError("Registrations have been closed by the event organizer")

    now = datetime.now(timezone.utc)
    reg_deadline = event.registration_deadline
    if reg_deadline.tzinfo is None:
        reg_deadline = reg_deadline.replace(tzinfo=timezone.utc)
    if reg_deadline < now:
        raise RegistrationClosedError("Registration deadline has passed for this event")

    # Duplicate check
    existing = await db.execute(
        select(Registration).where(
            and_(
                Registration.student_id == student_id,
                Registration.event_id == event_id,
            )
        )
    )
    existing_reg = existing.scalars().first()
    if existing_reg:
        if existing_reg.status in (RegistrationStatus.confirmed, RegistrationStatus.waitlisted):
            raise ConflictError("You are already registered for this event")
        if existing_reg.status == RegistrationStatus.cancelled:
            raise ConflictError("You previously cancelled your registration. Contact the organizer to re-register.")

    # Check student's total active registrations
    active_count_result = await db.execute(
        select(func.count(Registration.id)).where(
            and_(
                Registration.student_id == student_id,
                Registration.status == RegistrationStatus.confirmed,
            )
        )
    )
    active_count = active_count_result.scalar_one()
    if active_count >= settings.MAX_REGISTRATIONS_PER_STUDENT:
        raise ValidationError(
            f"You have reached the maximum of {settings.MAX_REGISTRATIONS_PER_STUDENT} active registrations"
        )

    # Eligibility
    eligible, reason = await check_event_eligibility(event, student)
    if not eligible:
        raise EligibilityError(reason)

    # Capacity check – put on waitlist if full
    if event.current_registrations >= event.max_capacity:
        status = RegistrationStatus.waitlisted
    else:
        status = RegistrationStatus.confirmed
        event.current_registrations += 1

    registration = Registration(
        student_id=student_id,
        event_id=event_id,
        status=status,
        registered_at=now,
    )
    db.add(registration)
    await db.commit()
    await db.refresh(registration)
    return registration


async def cancel_registration(
    student_id: uuid.UUID, event_id: uuid.UUID, db: AsyncSession
) -> Registration:
    """Cancel a student's registration and promote waitlisted student if any."""
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.student_id == student_id,
                Registration.event_id == event_id,
            )
        )
    )
    registration = result.scalars().first()
    if not registration:
        raise NotFoundError("Registration")

    if registration.status == RegistrationStatus.cancelled:
        raise ValidationError("Registration is already cancelled")

    was_confirmed = registration.status == RegistrationStatus.confirmed

    registration.status = RegistrationStatus.cancelled
    registration.cancelled_at = datetime.now(timezone.utc)

    # If was confirmed, restore capacity and promote waitlisted
    if was_confirmed:
        event = await db.get(Event, event_id)
        if event and event.current_registrations > 0:
            event.current_registrations -= 1

        # Promote first waitlisted student
        waitlisted_result = await db.execute(
            select(Registration)
            .where(
                and_(
                    Registration.event_id == event_id,
                    Registration.status == RegistrationStatus.waitlisted,
                )
            )
            .order_by(Registration.registered_at.asc())
            .limit(1)
        )
        waitlisted = waitlisted_result.scalars().first()
        if waitlisted and event:
            waitlisted.status = RegistrationStatus.confirmed
            event.current_registrations += 1

    await db.commit()
    await db.refresh(registration)
    return registration


async def get_student_registrations(
    student_id: uuid.UUID,
    db: AsyncSession,
    status: RegistrationStatus | None = None,
    page: int = 1,
    page_size: int = 20,
) -> list[Registration]:
    """Get all registrations for a student, optionally filtered by status."""
    query = (
        select(Registration)
        .options(
            selectinload(Registration.event).options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.venue),
            )
        )
        .where(Registration.student_id == student_id)
    )
    if status:
        query = query.where(Registration.status == status)

    query = query.order_by(Registration.registered_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_event_registrations(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
    status: RegistrationStatus | None = None,
    page: int = 1,
    page_size: int = 50,
) -> list[Registration]:
    """Get all registrations for an event (organizer access only)."""
    # Verify organizer owns the event
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))
    if str(event.organizer_id) != str(organizer_id):
        raise PermissionError("You do not own this event")

    query = (
        select(Registration)
        .options(selectinload(Registration.student))
        .where(Registration.event_id == event_id)
    )
    if status:
        query = query.where(Registration.status == status)

    query = query.order_by(Registration.registered_at.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_attendance(
    registration_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> Registration:
    """Mark a registration as attended."""
    registration = await db.get(Registration, registration_id)
    if not registration:
        raise NotFoundError("Registration")

    event = await db.get(Event, registration.event_id)
    if not event or str(event.organizer_id) != str(organizer_id):
        raise PermissionError("Not authorized to update this registration")

    registration.status = RegistrationStatus.attended
    registration.attended_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(registration)
    return registration
