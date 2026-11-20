"""Organizer ORM model."""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.copilot_session import CopilotSession
    from app.models.event import Event
    from app.models.invitation import Invitation
    from app.models.notification import Notification


class Organizer(Base, UUIDMixin, TimestampMixin):
    """Represents an event organizer (club, department, committee, society)."""

    __tablename__ = "organizers"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="club"
    )  # club | department | committee | society
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    events: Mapped[List["Event"]] = relationship(
        back_populates="organizer", cascade="all, delete-orphan", lazy="noload"
    )
    invitations: Mapped[List["Invitation"]] = relationship(
        back_populates="organizer", cascade="all, delete-orphan", lazy="noload"
    )
    copilot_sessions: Mapped[List["CopilotSession"]] = relationship(
        back_populates="organizer", cascade="all, delete-orphan", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Organizer id={self.id} org={self.organization_name}>"
