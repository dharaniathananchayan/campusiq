"""FeedbackAnalysis ORM model – AI-generated analysis of event feedback."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event


class FeedbackAnalysis(Base, UUIDMixin, TimestampMixin):
    """Stores AI-generated sentiment analysis and recommendations for event feedback."""

    __tablename__ = "feedback_analyses"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    overall_sentiment: Mapped[str] = mapped_column(Text, nullable=False, default="neutral")
    avg_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_responses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    positive_themes: Mapped[List] = mapped_column(JSON, default=list, nullable=False)
    negative_themes: Mapped[List] = mapped_column(JSON, default=list, nullable=False)
    recommendations: Mapped[List] = mapped_column(JSON, default=list, nullable=False)
    detailed_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────────
    event: Mapped["Event"] = relationship(back_populates="feedback_analysis", lazy="noload")

    def __repr__(self) -> str:
        return f"<FeedbackAnalysis event={self.event_id} sentiment={self.overall_sentiment}>"
