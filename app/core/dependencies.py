"""FastAPI dependency providers (DB session, current user, etc.)."""
from __future__ import annotations

import uuid
from typing import Annotated, AsyncGenerator

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal

# ── Database ─────────────────────────────────────────────────────────────────

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async SQLAlchemy session and ensure it is closed afterward."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DBSession = Annotated[AsyncSession, Depends(get_db)]

# ── Token extraction helpers ─────────────────────────────────────────────────


def _extract_payload(
    credentials: HTTPAuthorizationCredentials | None,
    expected_role: str | None = None,
) -> dict:
    if not credentials:
        raise UnauthorizedError("Missing authorization token")
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")
    if payload.get("type") != "access":
        raise UnauthorizedError("Token is not an access token")
    if expected_role and payload.get("role") != expected_role:
        raise ForbiddenError(f"This endpoint requires {expected_role} access")
    return payload


# ── Concrete dependencies ─────────────────────────────────────────────────────


class CurrentStudentDep:
    """FastAPI dependency that validates a student JWT and returns the payload."""

    def __call__(
        self,
        credentials: Annotated[
            HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
        ],
    ) -> dict:
        return _extract_payload(credentials, expected_role="student")


class CurrentOrganizerDep:
    """FastAPI dependency that validates an organizer JWT and returns the payload."""

    def __call__(
        self,
        credentials: Annotated[
            HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
        ],
    ) -> dict:
        return _extract_payload(credentials, expected_role="organizer")


class CurrentUserDep:
    """FastAPI dependency that accepts both student and organizer tokens."""

    def __call__(
        self,
        credentials: Annotated[
            HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
        ],
    ) -> dict:
        return _extract_payload(credentials)


_student_dep = CurrentStudentDep()
_organizer_dep = CurrentOrganizerDep()
_user_dep = CurrentUserDep()


def get_current_student(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> dict:
    """Return JWT payload for the currently authenticated student."""
    return _extract_payload(credentials, expected_role="student")


def get_current_organizer(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> dict:
    """Return JWT payload for the currently authenticated organizer."""
    return _extract_payload(credentials, expected_role="organizer")


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> dict:
    """Return JWT payload for the currently authenticated user (any role)."""
    return _extract_payload(credentials)


# Annotated shorthand types for cleaner endpoint signatures
StudentToken = Annotated[dict, Depends(get_current_student)]
OrganizerToken = Annotated[dict, Depends(get_current_organizer)]
AnyUserToken = Annotated[dict, Depends(get_current_user)]
