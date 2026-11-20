"""EventAnnouncement ORM model."""
from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.organizer import Organizer


class AnnouncementPriority(str, enum.Enum):
    normal = "normal"
    important = "important"
    urgent = "urgent"


class EventAnnouncement(Base, UUIDMixin, TimestampMixin):
    """Represents an announcement posted on an event's announcement board."""

    __tablename__ = "event_announcements"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organizer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizers.id", ondelete="SET NULL"), nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="normal", nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    event: Mapped["Event"] = relationship(back_populates="announcements", lazy="noload")
    organizer: Mapped[Optional["Organizer"]] = relationship(lazy="noload")

    def __repr__(self) -> str:
        return f"<EventAnnouncement event_id={self.event_id} title={self.title!r} priority={self.priority}>"
