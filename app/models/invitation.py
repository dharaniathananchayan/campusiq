"""Invitation ORM model."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.organizer import Organizer
    from app.models.student import Student


class InvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Invitation(Base, UUIDMixin, TimestampMixin):
    """AI-powered invitation from organizer to student for a specific event."""

    __tablename__ = "invitations"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizers.id", ondelete="CASCADE"), nullable=False
    )
    ai_match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, name="invitationstatus"),
        nullable=False,
        default=InvitationStatus.pending,
    )
    personalized_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ────────────────────────────────────────────────────────
    event: Mapped["Event"] = relationship(back_populates="invitations", lazy="noload")
    student: Mapped["Student"] = relationship(back_populates="invitations", lazy="noload")
    organizer: Mapped["Organizer"] = relationship(back_populates="invitations", lazy="noload")

    def __repr__(self) -> str:
        return f"<Invitation event={self.event_id} student={self.student_id} status={self.status}>"
