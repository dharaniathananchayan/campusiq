"""Forum moderation model – track members removed from an event's forum."""
from __future__ import annotations

import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class EventForumRemovedMember(Base, UUIDMixin, TimestampMixin):
    """Tracks a student/user who has been removed from a specific event's student forum."""

    __tablename__ = "event_forum_removed_members"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    removed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(500), default="Removed by event organizer", nullable=False)

    def __repr__(self) -> str:
        return f"<EventForumRemovedMember event={self.event_id} user={self.user_name}>"
