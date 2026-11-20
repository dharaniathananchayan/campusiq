"""Bookmark ORM model."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.student import Student


class Bookmark(Base, UUIDMixin, TimestampMixin):
    """A student's bookmarked event."""

    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_bookmark"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ── Relationships ────────────────────────────────────────────────────────
    student: Mapped["Student"] = relationship(back_populates="bookmarks", lazy="noload")
    event: Mapped["Event"] = relationship(back_populates="bookmarks", lazy="noload")

    def __repr__(self) -> str:
        return f"<Bookmark student={self.student_id} event={self.event_id}>"
