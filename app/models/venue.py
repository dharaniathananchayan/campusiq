"""Venue ORM model."""
from __future__ import annotations

from typing import TYPE_CHECKING, Dict, List, Optional

from sqlalchemy import Boolean, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event


class Venue(Base, UUIDMixin, TimestampMixin):
    """Represents a physical venue on campus."""

    __tablename__ = "venues"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    amenities: Mapped[Dict] = mapped_column(JSON, default=dict, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    events: Mapped[List["Event"]] = relationship(back_populates="venue", lazy="noload")

    def __repr__(self) -> str:
        return f"<Venue name={self.name} capacity={self.capacity}>"
