"""Student ORM model."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.bookmark import Bookmark
    from app.models.feedback import Feedback
    from app.models.interest_profile import InterestProfile
    from app.models.invitation import Invitation
    from app.models.notification import Notification
    from app.models.registration import Registration


class Student(Base, UUIDMixin, TimestampMixin):
    """Represents a registered student user."""

    __tablename__ = "students"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    institute_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year_of_study: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    registrations: Mapped[List["Registration"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", lazy="noload"
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", lazy="noload"
    )
    feedback: Mapped[List["Feedback"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", lazy="noload"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        primaryjoin="and_(Student.id == foreign(Notification.recipient_id), Notification.recipient_type == 'student')",
        lazy="noload",
        viewonly=True,
    )
    interest_profile: Mapped[Optional["InterestProfile"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", uselist=False, lazy="noload"
    )
    invitations: Mapped[List["Invitation"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Student id={self.id} email={self.email}>"
