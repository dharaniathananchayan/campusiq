"""EventForumMessage ORM model for Student Forum Q&A chat room."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event


class EventForumMessage(Base, UUIDMixin, TimestampMixin):
    """Represents a message/query in an event's Student Forum chat room."""

    __tablename__ = "event_forum_messages"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    user_role: Mapped[str] = mapped_column(String(50), nullable=False)  # student | organizer
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    event: Mapped["Event"] = relationship(back_populates="forum_messages", lazy="noload")

    def __repr__(self) -> str:
        return f"<EventForumMessage event_id={self.event_id} user={self.user_name} role={self.user_role}>"
