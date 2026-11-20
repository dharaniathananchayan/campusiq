"""AI feature Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.event import EventListResponse
from app.schemas.student import StudentPublicResponse


# ── Interest Profile ──────────────────────────────────────────────────────────

class InterestProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: uuid.UUID
    category_weights: Dict
    keyword_interests: Dict
    preferred_departments: List
    engagement_score: float
    total_registrations: int
    total_bookmarks: int
    total_feedback: int
    last_updated: datetime


# ── AI Targeting ──────────────────────────────────────────────────────────────

class TargetedStudent(BaseModel):
    student: StudentPublicResponse
    match_score: float = Field(ge=0.0, le=1.0)
    match_reasons: List[str]


class TargetingResponse(BaseModel):
    event_id: uuid.UUID
    recommended_students: List[TargetedStudent]
    total_analyzed: int


class InvitationCreate(BaseModel):
    student_ids: List[uuid.UUID] = Field(min_length=1, max_length=200)
    personalized_message: Optional[str] = Field(default=None, max_length=1000)


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    student_id: uuid.UUID
    ai_match_score: Optional[float] = None
    status: str
    personalized_message: Optional[str] = None
    sent_at: datetime


# ── Event Matching ────────────────────────────────────────────────────────────

class EventMatchScore(BaseModel):
    event: EventListResponse
    compatibility_score: float = Field(ge=0.0, le=100.0)
    match_reasons: List[str]


class EventMatchScoreList(BaseModel):
    items: List[EventMatchScore]
    total: int


# ── Feedback Analysis ─────────────────────────────────────────────────────────

class FeedbackAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: uuid.UUID
    overall_sentiment: str
    avg_rating: float
    total_responses: int
    positive_themes: List[str]
    negative_themes: List[str]
    recommendations: List[str]
    detailed_analysis: Optional[str] = None
    analyzed_at: datetime


# ── RAG Chat Assistant ────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str
    timestamp: datetime


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[uuid.UUID] = None


class AssistantChatResponse(BaseModel):
    session_id: uuid.UUID
    message: str
    role: str = "assistant"
    timestamp: datetime
    sources: List[Dict] = Field(default_factory=list)


# ── Event Co-Pilot ────────────────────────────────────────────────────────────

class CopilotStartRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    initial_message: str = Field(min_length=5, max_length=2000)


class CopilotChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class CopilotChatResponse(BaseModel):
    session_id: uuid.UUID
    message: str
    generated_event_draft: Dict
    suggested_actions: List[str]
    timestamp: datetime


class CopilotSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: Optional[str] = None
    conversation_history: List
    generated_event_draft: Dict
    is_active: bool
    applied_event_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
