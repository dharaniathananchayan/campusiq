"""Authentication service – registration, login, token refresh."""
from __future__ import annotations

import uuid

from jose import JWTError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.organizer import Organizer
from app.models.student import Student
from app.schemas.auth import (
    OrganizerRegisterRequest,
    StudentRegisterRequest,
    TokenResponse,
)


async def register_student(
    data: StudentRegisterRequest, db: AsyncSession
) -> tuple[Student, TokenResponse]:
    """Register a new student and return their JWT tokens."""
    # Check email uniqueness
    result = await db.execute(select(Student).where(Student.email == data.email))
    if result.scalars().first():
        raise ConflictError("A student with this email already exists")

    # Generate or check student_id uniqueness
    student_id = data.student_id or f"STU-{uuid.uuid4().hex[:8].upper()}"
    if data.student_id:
        result = await db.execute(select(Student).where(Student.student_id == data.student_id))
        if result.scalars().first():
            raise ConflictError("A student with this student ID already exists")

    department = data.department or data.institute_name or "General"

    student = Student(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        institute_name=data.institute_name,
        student_id=student_id,
        department=department,
        year_of_study=data.year_of_study,
        phone=data.phone,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    tokens = _build_tokens(str(student.id), "student")
    return student, tokens


async def register_organizer(
    data: OrganizerRegisterRequest, db: AsyncSession
) -> tuple[Organizer, TokenResponse]:
    """Register a new organizer and return their JWT tokens."""
    result = await db.execute(select(Organizer).where(Organizer.email == data.email))
    if result.scalars().first():
        raise ConflictError("An organizer with this email already exists")

    organizer = Organizer(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        organization_name=data.organization_name,
        organization_type=data.organization_type,
        contact_phone=data.contact_phone,
        description=data.description,
        website=data.website,
    )
    db.add(organizer)
    await db.commit()
    await db.refresh(organizer)

    tokens = _build_tokens(str(organizer.id), "organizer")
    return organizer, tokens


async def authenticate_student(email: str, password: str, db: AsyncSession) -> Student:
    """Verify student credentials; raise UnauthorizedError on failure."""
    result = await db.execute(select(Student).where(Student.email == email))
    student = result.scalars().first()
    if not student or not verify_password(password, student.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not student.is_active:
        raise UnauthorizedError("Your account has been deactivated")
    return student


async def authenticate_organizer(email: str, password: str, db: AsyncSession) -> Organizer:
    """Verify organizer credentials; raise UnauthorizedError on failure."""
    result = await db.execute(select(Organizer).where(Organizer.email == email))
    organizer = result.scalars().first()
    if not organizer or not verify_password(password, organizer.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not organizer.is_active:
        raise UnauthorizedError("Your account has been deactivated")
    return organizer


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenResponse:
    """Validate refresh token and issue new access + refresh token pair."""
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Provided token is not a refresh token")

    subject: str = payload["sub"]
    role: str = payload["role"]

    # Verify the user still exists and is active
    if role == "student":
        import uuid as _uuid
        result = await db.execute(select(Student).where(Student.id == _uuid.UUID(subject)))
        user = result.scalars().first()
    else:
        import uuid as _uuid
        result = await db.execute(select(Organizer).where(Organizer.id == _uuid.UUID(subject)))
        user = result.scalars().first()

    if not user or not user.is_active:
        raise UnauthorizedError("User not found or deactivated")

    return _build_tokens(subject, role)


def _build_tokens(subject: str, role: str) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(subject, role),
        refresh_token=create_refresh_token(subject, role),
        role=role,
    )
