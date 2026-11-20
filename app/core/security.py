"""JWT creation/verification and password hashing utilities."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt  # noqa: F401

from app.core.config import get_settings

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Return bcrypt hash of *password*."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ── JWT ─────────────────────────────────────────────────────────────────────
def _create_token(
    data: dict,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    payload = data.copy()
    now = datetime.now(timezone.utc)
    payload.update(
        {
            "iat": now,
            "exp": now + expires_delta,
            "type": token_type,
        }
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    subject: str,
    role: str,
    extra: Optional[dict] = None,
) -> str:
    """Create a short-lived JWT access token.

    Args:
        subject: User UUID as string.
        role: ``student`` or ``organizer``.
        extra: Additional payload fields.
    """
    data: dict = {"sub": subject, "role": role}
    if extra:
        data.update(extra)
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, "access", expires)


def create_refresh_token(subject: str, role: str) -> str:
    """Create a long-lived JWT refresh token."""
    data: dict = {"sub": subject, "role": role}
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data, "refresh", expires)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token.

    Raises:
        JWTError: If the token is invalid or expired.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
