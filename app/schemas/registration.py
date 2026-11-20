"""Registration, Feedback, Bookmark, and Notification schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.registration import RegistrationStatus
from app.models.notification import NotificationType
from app.schemas.event import EventListResponse
from app.schemas.student import StudentPublicResponse


# ── Registration ──────────────────────────────────────────────────────────────

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    event_id: uuid.UUID
    status: RegistrationStatus
    registered_at: datetime
    cancelled_at: Optional[datetime] = None
    attended_at: Optional[datetime] = None
    event: Optional[EventListResponse] = None


class RegistrationWithStudentResponse(BaseModel):
    """Registration entry enriched with student info (for organizer view)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student: StudentPublicResponse
    event_id: uuid.UUID
    status: RegistrationStatus
    registered_at: datetime
    cancelled_at: Optional[datetime] = None
    attended_at: Optional[datetime] = None


# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: bool = False


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    student: Optional[StudentPublicResponse] = None  # None if anonymous
    rating: int
    comment: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    is_anonymous: bool
    created_at: datetime


class FeedbackSummary(BaseModel):
    avg_rating: float
    total_count: int
    rating_distribution: Dict[str, int]  # {"1": 3, "2": 5, ...}
    sentiment_breakdown: Dict[str, int]  # {"positive": 10, "neutral": 5, ...}


# ── Bookmark ──────────────────────────────────────────────────────────────────

class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    event_id: uuid.UUID
    event: Optional[EventListResponse] = None
    created_at: datetime


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    metadata_: Optional[dict] = Field(default=None, alias="metadata_")
    action_url: Optional[str] = None
    created_at: datetime
