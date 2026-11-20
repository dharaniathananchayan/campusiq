"""Announcement Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EventAnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=5)
    priority: str = Field(default="normal")  # "normal" | "important" | "urgent"
    is_pinned: bool = Field(default=False)


class EventAnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    organizer_id: Optional[uuid.UUID] = None
    title: str
    content: str
    priority: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    event_title: Optional[str] = None
    organizer_name: Optional[str] = None


class StudentAnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    event_title: str
    organizer_name: Optional[str] = None
    title: str
    content: str
    priority: str
    is_pinned: bool
    created_at: datetime
