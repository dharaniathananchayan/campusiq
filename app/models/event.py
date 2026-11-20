"""Event ORM model."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

try:
    from pgvector.sqlalchemy import Vector
    _VECTOR_AVAILABLE = True
except ImportError:
    _VECTOR_AVAILABLE = False

if TYPE_CHECKING:
    from app.models.announcement import EventAnnouncement
    from app.models.bookmark import Bookmark
    from app.models.category import Category
    from app.models.copilot_session import CopilotSession
    from app.models.feedback import Feedback
    from app.models.feedback_analysis import FeedbackAnalysis
    from app.models.forum import EventForumMessage
    from app.models.invitation import Invitation
    from app.models.organizer import Organizer
    from app.models.registration import Registration
    from app.models.venue import Venue


class EventStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    cancelled = "cancelled"
    completed = "completed"
    archived = "archived"


class Event(Base, UUIDMixin, TimestampMixin):
    """Represents a campus event."""

    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    organizer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    venue_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True
    )

    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    current_registrations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="eventstatus"), nullable=False, default=EventStatus.draft
    )

    # eligibility_criteria: {"departments": ["CS","IT"], "year_of_study": [1,2], "custom": ""}
    eligibility_criteria: Mapped[Dict] = mapped_column(JSON, default=dict, nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    banner_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    registration_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_registration_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_student_forum: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    forum_access_mode: Mapped[str] = mapped_column(String(50), default="open", nullable=False)

    # pgvector embedding (768-dim for Gemini text-embedding-004)
    if _VECTOR_AVAILABLE:
        embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(384), nullable=True)
    else:
        embedding = None

    # ── Relationships ─────────────────────────────────────────────────────────
    organizer: Mapped["Organizer"] = relationship(back_populates="events", lazy="noload")
    category: Mapped[Optional["Category"]] = relationship(back_populates="events", lazy="noload")
    venue: Mapped[Optional["Venue"]] = relationship(back_populates="events", lazy="noload")
    registrations: Mapped[List["Registration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    feedback: Mapped[List["Feedback"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    invitations: Mapped[List["Invitation"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    feedback_analysis: Mapped[Optional["FeedbackAnalysis"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", uselist=False, lazy="noload"
    )
    announcements: Mapped[List["EventAnnouncement"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    forum_messages: Mapped[List["EventForumMessage"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )

    @property
    def available_seats(self) -> int:
        return max(0, self.max_capacity - self.current_registrations)

    @property
    def is_full(self) -> bool:
        return self.current_registrations >= self.max_capacity

    def __repr__(self) -> str:
        return f"<Event title={self.title!r} status={self.status}>"
