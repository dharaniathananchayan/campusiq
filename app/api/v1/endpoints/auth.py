"""Auth endpoints – student/organizer registration and login."""
from __future__ import annotations

from fastapi import APIRouter, status

from app.core.dependencies import DBSession, OrganizerToken, StudentToken
from app.schemas.auth import (
    LoginRequest,
    OrganizerRegisterRequest,
    RefreshRequest,
    StudentRegisterRequest,
    TokenResponse,
)
from app.schemas.student import StudentResponse
from app.schemas.organizer import OrganizerResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Student Auth ──────────────────────────────────────────────────────────────

@router.post(
    "/student/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
)
async def student_register(data: StudentRegisterRequest, db: DBSession):
    _student, tokens = await auth_service.register_student(data, db)
    return tokens


@router.post(
    "/student/login",
    response_model=TokenResponse,
    summary="Student login",
)
async def student_login(data: LoginRequest, db: DBSession):
    student = await auth_service.authenticate_student(data.email, data.password, db)
    from app.core.security import create_access_token, create_refresh_token
    from app.schemas.auth import TokenResponse as TR
    return TR(
        access_token=create_access_token(str(student.id), "student"),
        refresh_token=create_refresh_token(str(student.id), "student"),
        role="student",
    )


# ── Organizer Auth ─────────────────────────────────────────────────────────────

@router.post(
    "/organizer/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new organizer account",
)
async def organizer_register(data: OrganizerRegisterRequest, db: DBSession):
    _organizer, tokens = await auth_service.register_organizer(data, db)
    return tokens


@router.post(
    "/organizer/login",
    response_model=TokenResponse,
    summary="Organizer login",
)
async def organizer_login(data: LoginRequest, db: DBSession):
    organizer = await auth_service.authenticate_organizer(data.email, data.password, db)
    from app.core.security import create_access_token, create_refresh_token
    from app.schemas.auth import TokenResponse as TR
    return TR(
        access_token=create_access_token(str(organizer.id), "organizer"),
        refresh_token=create_refresh_token(str(organizer.id), "organizer"),
        role="organizer",
    )


# ── Token Refresh ─────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh_token(data: RefreshRequest, db: DBSession):
    return await auth_service.refresh_tokens(data.refresh_token, db)
