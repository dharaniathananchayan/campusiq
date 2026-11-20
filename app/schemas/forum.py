"""Forum Pydantic schemas for Student Forum chat room."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ForumMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ForumMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    user_role: str  # student | organizer
    user_name: str
    message: str
    created_at: datetime


class ForumControlsUpdate(BaseModel):
    has_student_forum: Optional[bool] = None
    forum_access_mode: Optional[str] = Field(default=None, pattern="^(open|organizer_only)$")


class ForumMemberResponse(BaseModel):
    user_id: uuid.UUID
    user_name: str
    user_role: str
    message_count: int
    last_active: datetime
    is_removed: bool = False


class RemoveMemberRequest(BaseModel):
    reason: Optional[str] = Field(default="Removed by event organizer", max_length=500)
