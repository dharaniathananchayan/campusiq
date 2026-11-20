"""Student profile endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, StudentToken
from app.core.exceptions import NotFoundError
from app.models.student import Student
from app.models.registration import Registration, RegistrationStatus
from app.models.event import Event
from app.schemas.common import MessageResponse
from app.schemas.student import StudentResponse, StudentUpdate
from app.schemas.announcement import StudentAnnouncementResponse
from app.schemas.invitation import StudentInvitationResponse, AcceptInvitationResponse
from app.services import announcement_service, invitation_service

router = APIRouter(prefix="/students", tags=["Students"])


async def _get_student(student_id: uuid.UUID, db) -> Student:
    student = await db.get(Student, student_id)
    if not student or not student.is_active:
        raise NotFoundError("Student")
    return student


@router.get("/me", response_model=StudentResponse, summary="Get my profile")
async def get_my_profile(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await _get_student(student_id, db)


@router.put("/me", response_model=StudentResponse, summary="Update my profile")
async def update_my_profile(data: StudentUpdate, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    student = await _get_student(student_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    await db.commit()
    await db.refresh(student)
    return student


@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Deactivate my account",
)
async def deactivate_account(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    student = await _get_student(student_id, db)
    student.is_active = False
    await db.commit()
    return MessageResponse(message="Your account has been deactivated")


@router.get(
    "/me/event-profile",
    summary="Get full event participation profile",
)
async def get_event_profile(token: StudentToken, db: DBSession):
    """Student event profile – full participation history and stats."""
    student_id = uuid.UUID(token["sub"])
    student = await _get_student(student_id, db)

    # Load registrations with events
    regs_result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.event).options(
                selectinload(Event.category),
                selectinload(Event.organizer),
            )
        )
        .where(Registration.student_id == student_id)
        .order_by(Registration.registered_at.desc())
    )
    registrations = list(regs_result.scalars().all())

    total = len(registrations)
    attended = sum(1 for r in registrations if r.status == RegistrationStatus.attended)
    cancelled = sum(1 for r in registrations if r.status == RegistrationStatus.cancelled)
    confirmed = sum(1 for r in registrations if r.status == RegistrationStatus.confirmed)

    # Category breakdown
    cat_counts: dict = {}
    for r in registrations:
        if r.event and r.event.category:
            name = r.event.category.name
            cat_counts[name] = cat_counts.get(name, 0) + 1

    return {
        "student": StudentResponse.model_validate(student),
        "stats": {
            "total_registrations": total,
            "attended": attended,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "attendance_rate": round(attended / total * 100, 1) if total > 0 else 0.0,
        },
        "category_breakdown": cat_counts,
        "recent_events": [
            {
                "event_id": str(r.event_id),
                "event_title": r.event.title if r.event else "Unknown",
                "status": r.status.value,
                "registered_at": r.registered_at.isoformat(),
            }
            for r in registrations[:10]
        ],
    }


@router.get(
    "/me/announcements",
    response_model=list[StudentAnnouncementResponse],
    summary="Get announcement board for all events I registered for (student)",
)
async def get_my_event_announcements(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await announcement_service.get_student_announcements(student_id, db)


@router.get(
    "/me/invitations",
    response_model=list[StudentInvitationResponse],
    summary="Get all event invitations addressed to the student",
)
async def get_my_invitations(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await invitation_service.get_student_invitations(student_id, db)


@router.post(
    "/me/invitations/{invitation_id}/accept",
    response_model=AcceptInvitationResponse,
    summary="Accept an event invitation and auto-register",
)
async def accept_invitation(invitation_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await invitation_service.accept_student_invitation(invitation_id, student_id, db)


@router.post(
    "/me/invitations/{invitation_id}/decline",
    summary="Decline an event invitation",
)
async def decline_invitation(invitation_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await invitation_service.decline_student_invitation(invitation_id, student_id, db)
