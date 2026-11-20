"""Event service – CRUD, publish, search, eligibility checking."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.models.category import Category
from app.models.event import Event, EventStatus
from app.models.organizer import Organizer
from app.models.registration import Registration, RegistrationStatus
from app.models.student import Student
from app.models.venue import Venue
from app.schemas.event import EventCreate, EventSearchFilters, EventUpdate
from app.schemas.common import PaginatedResponse


async def create_event(
    organizer_id: uuid.UUID, data: EventCreate, db: AsyncSession
) -> Event:
    """Create a new event in draft status."""
    # Validate category exists
    cat = await db.get(Category, data.category_id)
    if not cat:
        raise NotFoundError("Category", str(data.category_id))

    # Validate venue if provided
    if data.venue_id:
        venue = await db.get(Venue, data.venue_id)
        if not venue:
            raise NotFoundError("Venue", str(data.venue_id))
        if data.max_capacity > venue.capacity:
            raise ValidationError(
                f"Event capacity ({data.max_capacity}) exceeds venue capacity ({venue.capacity})"
            )

    eligibility_dict = data.eligibility_criteria.model_dump()
    event = Event(
        organizer_id=organizer_id,
        category_id=data.category_id,
        venue_id=data.venue_id,
        title=data.title,
        description=data.description,
        short_description=data.short_description,
        start_datetime=data.start_datetime,
        end_datetime=data.end_datetime,
        registration_deadline=data.registration_deadline,
        max_capacity=data.max_capacity,
        eligibility_criteria=eligibility_dict,
        tags=data.tags,
        banner_url=data.banner_url,
        is_featured=data.is_featured,
        registration_fee=data.registration_fee,
        contact_email=str(data.contact_email) if data.contact_email else None,
        has_student_forum=data.has_student_forum,
        status=data.status if data.status is not None else EventStatus.draft,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    # Trigger async embedding generation (background)
    return event


async def get_event_by_id(event_id: uuid.UUID, db: AsyncSession) -> Event:
    """Fetch a single event with organizer, category, venue loaded."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise NotFoundError("Event", str(event_id))
    return event


async def update_event(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    data: EventUpdate,
    db: AsyncSession,
) -> Event:
    """Update a draft or published event (organizer only)."""
    event = await get_event_by_id(event_id, db)
    _assert_organizer_owns_event(event, organizer_id)

    if event.status == EventStatus.cancelled:
        raise ValidationError("Cannot update a cancelled event")

    update_data = data.model_dump(exclude_none=True)
    if "eligibility_criteria" in update_data:
        update_data["eligibility_criteria"] = update_data["eligibility_criteria"].model_dump() \
            if hasattr(update_data["eligibility_criteria"], "model_dump") \
            else update_data["eligibility_criteria"]

    for field, value in update_data.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)
    return event


async def publish_event(
    event_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> Event:
    """Transition a draft event to published."""
    event = await get_event_by_id(event_id, db)
    _assert_organizer_owns_event(event, organizer_id)

    if event.status == EventStatus.published:
        raise ValidationError("Event is already published")
    if event.status in (EventStatus.cancelled, EventStatus.completed):
        raise ValidationError(f"Cannot publish a {event.status.value} event")

    now = datetime.now(timezone.utc)
    # Make comparisons tz-safe: SQLite returns naive datetimes, PostgreSQL returns aware
    def _to_aware(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    if _to_aware(event.registration_deadline) <= now:
        raise ValidationError("Registration deadline has already passed")
    if _to_aware(event.start_datetime) <= now:
        raise ValidationError("Event start time is already in the past")

    event.status = EventStatus.published
    await db.commit()
    await db.refresh(event)
    return event


async def cancel_event(
    event_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> Event:
    """Cancel a published event."""
    event = await get_event_by_id(event_id, db)
    _assert_organizer_owns_event(event, organizer_id)

    if event.status == EventStatus.cancelled:
        raise ValidationError("Event is already cancelled")

    event.status = EventStatus.cancelled
    await db.commit()
    await db.refresh(event)
    return event


async def archive_event(
    event_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> Event:
    """Archive an event."""
    event = await get_event_by_id(event_id, db)
    _assert_organizer_owns_event(event, organizer_id)

    event.status = EventStatus.archived
    await db.commit()
    await db.refresh(event)
    return event


async def delete_event(
    event_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> None:
    """Delete an event owned by the organizer."""
    event = await get_event_by_id(event_id, db)
    _assert_organizer_owns_event(event, organizer_id)

    await db.delete(event)
    await db.commit()


async def list_events(
    filters: EventSearchFilters,
    db: AsyncSession,
    student: Optional[Student] = None,
) -> PaginatedResponse:
    """List published events with filtering, search, and pagination."""
    query = (
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(Event.status == (filters.status or EventStatus.published))
    )

    if filters.q:
        search_term = f"%{filters.q}%"
        query = query.where(
            or_(
                Event.title.ilike(search_term),
                Event.description.ilike(search_term),
                Event.short_description.ilike(search_term),
            )
        )

    if filters.category_id:
        query = query.where(Event.category_id == filters.category_id)
    if filters.venue_id:
        query = query.where(Event.venue_id == filters.venue_id)
    if filters.is_featured is not None:
        query = query.where(Event.is_featured == filters.is_featured)
    if filters.has_seats_available:
        query = query.where(Event.current_registrations < Event.max_capacity)
    if filters.start_date:
        query = query.where(func.date(Event.start_datetime) >= filters.start_date)
    if filters.end_date:
        query = query.where(func.date(Event.start_datetime) <= filters.end_date)
    if filters.min_capacity:
        query = query.where(Event.max_capacity >= filters.min_capacity)

    # Eligibility filters
    if student:
        if filters.department:
            query = query.where(
                or_(
                    func.jsonb_array_length(
                        Event.eligibility_criteria["departments"].as_json()
                    ) == 0,
                    Event.eligibility_criteria["departments"].contains(
                        f'["{filters.department}"]'
                    ),
                )
            )
        if filters.year_of_study:
            query = query.where(
                or_(
                    func.jsonb_array_length(
                        Event.eligibility_criteria["year_of_study"].as_json()
                    ) == 0,
                    Event.eligibility_criteria["year_of_study"].contains(
                        f"[{filters.year_of_study}]"
                    ),
                )
            )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    offset = (filters.page - 1) * filters.page_size
    query = query.order_by(Event.is_featured.desc(), Event.start_datetime.asc())
    query = query.offset(offset).limit(filters.page_size)

    result = await db.execute(query)
    events = list(result.scalars().all())

    from app.schemas.event import EventListResponse
    serialized = [EventListResponse.model_validate(e) for e in events]

    return PaginatedResponse.create(
        items=serialized, total=total, page=filters.page, page_size=filters.page_size
    )


async def get_organizer_events(
    organizer_id: uuid.UUID,
    db: AsyncSession,
    status: Optional[EventStatus] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponse:
    """List all events belonging to an organizer."""
    query = (
        select(Event)
        .options(
            selectinload(Event.category),
            selectinload(Event.venue),
            selectinload(Event.organizer),
        )
        .where(Event.organizer_id == organizer_id)
    )
    if status:
        query = query.where(Event.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    query = query.order_by(Event.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    events = list(result.scalars().all())

    from app.schemas.event import EventListResponse
    serialized = [EventListResponse.model_validate(e) for e in events]
    return PaginatedResponse.create(items=serialized, total=total, page=page, page_size=page_size)


async def check_event_eligibility(
    event: Event, student: Student
) -> Tuple[bool, str]:
    """Check if a student meets an event's eligibility criteria."""
    criteria = event.eligibility_criteria or {}

    departments = criteria.get("departments", [])
    if departments and student.department not in departments:
        return False, f"This event is restricted to: {', '.join(departments)}"

    years = criteria.get("year_of_study", [])
    if years and student.year_of_study not in years:
        return False, f"This event is for year(s): {years}"

    return True, "Eligible"


def _assert_organizer_owns_event(event: Event, organizer_id: uuid.UUID) -> None:
    if str(event.organizer_id) != str(organizer_id):
        raise ForbiddenError("You do not have permission to modify this event")
