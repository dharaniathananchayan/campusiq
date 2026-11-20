"""Category ORM model."""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.event import Event


class Category(Base, UUIDMixin, TimestampMixin):
    """Event category (Technical, Cultural, Sports, etc.)."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)   # emoji
    color_hex: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # #RRGGBB
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    events: Mapped[List["Event"]] = relationship(back_populates="category", lazy="noload")

    def __repr__(self) -> str:
        return f"<Category name={self.name}>"
