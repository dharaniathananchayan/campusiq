"""Registration endpoints – register, cancel, list, mark attendance."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Query, status

from app.core.dependencies import DBSession, OrganizerToken, StudentToken
from app.models.registration import RegistrationStatus
from app.schemas.common import MessageResponse
from app.schemas.registration import RegistrationResponse, RegistrationWithStudentResponse
from app.services.registration_service import (
    cancel_registration,
    get_event_registrations,
    get_student_registrations,
    mark_attendance,
    register_for_event,
)

router = APIRouter(tags=["Registrations"])


@router.post(
    "/events/{event_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event (student)",
)
async def register(event_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await register_for_event(student_id, event_id, db)


@router.delete(
    "/events/{event_id}/register",
    response_model=MessageResponse,
    summary="Cancel registration for an event (student)",
)
async def cancel(event_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    await cancel_registration(student_id, event_id, db)
    return MessageResponse(message="Registration cancelled successfully")


@router.get(
    "/students/me/registrations",
    response_model=list[RegistrationResponse],
    summary="Get my registrations (student)",
)
async def my_registrations(
    token: StudentToken,
    db: DBSession,
    status_filter: Optional[RegistrationStatus] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    student_id = uuid.UUID(token["sub"])
    return await get_student_registrations(
        student_id, db, status=status_filter, page=page, page_size=page_size
    )


@router.get(
    "/events/{event_id}/registrations",
    response_model=list[RegistrationWithStudentResponse],
    summary="Get event registrations (organizer)",
)
async def event_registrations(
    event_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
    status_filter: Optional[RegistrationStatus] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    organizer_id = uuid.UUID(token["sub"])
    return await get_event_registrations(
        event_id, organizer_id, db, status=status_filter, page=page, page_size=page_size
    )


@router.post(
    "/registrations/{registration_id}/attend",
    response_model=RegistrationResponse,
    summary="Mark attendance for a registration (organizer)",
)
async def mark_attended(
    registration_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    return await mark_attendance(registration_id, organizer_id, db)
