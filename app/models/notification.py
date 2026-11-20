"""Notification ORM model."""
from __future__ import annotations

import enum
import uuid
from typing import Dict, Optional

from sqlalchemy import Boolean, Enum, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class NotificationType(str, enum.Enum):
    new_event = "new_event"
    confirmation = "confirmation"
    reminder = "reminder"
    change = "change"
    invitation = "invitation"
    cancellation = "cancellation"
    general = "general"


class RecipientType(str, enum.Enum):
    student = "student"
    organizer = "organizer"


class Notification(Base, UUIDMixin, TimestampMixin):
    """In-app notification for students or organizers."""

    __tablename__ = "notifications"

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    recipient_type: Mapped[RecipientType] = mapped_column(
        Enum(RecipientType, name="recipienttype"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notificationtype"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    metadata_: Mapped[Dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<Notification type={self.type} recipient={self.recipient_id} read={self.is_read}>"
