"""CopilotSession ORM model – multi-turn AI event planning session."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import Boolean, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.organizer import Organizer


class CopilotSession(Base, UUIDMixin, TimestampMixin):
    """Stores a multi-turn AI co-pilot session for an organizer planning an event."""

    __tablename__ = "copilot_sessions"

    organizer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # List of {"role": "user"|"model", "content": "...", "timestamp": "..."}
    conversation_history: Mapped[List] = mapped_column(JSON, default=list, nullable=False)

    # Current generated event draft fields
    generated_event_draft: Mapped[Dict] = mapped_column(JSON, default=dict, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Set when the organizer applies the draft to create an actual event
    applied_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────────
    organizer: Mapped["Organizer"] = relationship(back_populates="copilot_sessions", lazy="noload")
    applied_event: Mapped[Optional["Event"]] = relationship(
        foreign_keys=[applied_event_id], lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<CopilotSession organizer={self.organizer_id} active={self.is_active}>"
