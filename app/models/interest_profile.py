"""InterestProfile ORM model – AI-maintained student interest vector."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

try:
    from pgvector.sqlalchemy import Vector
    _VECTOR_AVAILABLE = True
except ImportError:
    _VECTOR_AVAILABLE = False

if TYPE_CHECKING:
    from app.models.student import Student


class InterestProfile(Base, UUIDMixin, TimestampMixin):
    """Dynamically maintained AI interest profile for a student."""

    __tablename__ = "interest_profiles"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    # {category_id: weight}  – float scores summing to ~1.0
    category_weights: Mapped[Dict] = mapped_column(JSON, default=dict, nullable=False)
    # {keyword: score}
    keyword_interests: Mapped[Dict] = mapped_column(JSON, default=dict, nullable=False)
    # preferred departments inferred from event attendance
    preferred_departments: Mapped[List] = mapped_column(JSON, default=list, nullable=False)

    engagement_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_registrations: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bookmarks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_feedback: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    if _VECTOR_AVAILABLE:
        embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(384), nullable=True)
    else:
        embedding = None

    # ── Relationships ────────────────────────────────────────────────────────
    student: Mapped["Student"] = relationship(
        back_populates="interest_profile", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<InterestProfile student={self.student_id} score={self.engagement_score:.2f}>"
