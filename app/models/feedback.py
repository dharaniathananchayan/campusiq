"""Feedback ORM model."""
from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.student import Student


class SentimentType(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class Feedback(Base, UUIDMixin, TimestampMixin):
    """Student feedback and rating for a completed event."""

    __tablename__ = "feedback"
    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_feedback"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sentiment: Mapped[Optional[SentimentType]] = mapped_column(
        Enum(SentimentType, name="sentimenttype"), nullable=True
    )
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    student: Mapped["Student"] = relationship(back_populates="feedback", lazy="noload")
    event: Mapped["Event"] = relationship(back_populates="feedback", lazy="noload")

    def __repr__(self) -> str:
        return f"<Feedback student={self.student_id} event={self.event_id} rating={self.rating}>"
