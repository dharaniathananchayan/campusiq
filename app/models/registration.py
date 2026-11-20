"""Registration ORM model."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.student import Student


class RegistrationStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    waitlisted = "waitlisted"
    attended = "attended"


class Registration(Base, UUIDMixin, TimestampMixin):
    """Records a student's registration for an event."""

    __tablename__ = "registrations"
    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        Enum(RegistrationStatus, name="registrationstatus"),
        nullable=False,
        default=RegistrationStatus.confirmed,
    )
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    attended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────────────────
    student: Mapped["Student"] = relationship(back_populates="registrations", lazy="noload")
    event: Mapped["Event"] = relationship(back_populates="registrations", lazy="noload")

    def __repr__(self) -> str:
        return f"<Registration student={self.student_id} event={self.event_id} status={self.status}>"
