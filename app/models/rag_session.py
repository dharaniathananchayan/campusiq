"""RAGSession ORM model – RAG assistant conversation sessions."""
from __future__ import annotations

import uuid
from typing import List

from sqlalchemy import Boolean, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class RAGSession(Base, UUIDMixin, TimestampMixin):
    """Stores a RAG campus assistant conversation session for a student or organizer."""

    __tablename__ = "rag_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    user_type: Mapped[str] = mapped_column(String(20), nullable=False)  # student | organizer
    # List of {"role": "user"|"assistant", "content": "...", "timestamp": "..."}
    conversation_history: Mapped[List] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<RAGSession user={self.user_id} type={self.user_type}>"
