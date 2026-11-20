"""Invitation Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class StudentInvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    organizer_id: uuid.UUID
    status: str
    personalized_message: Optional[str] = None
    ai_match_score: Optional[float] = None
    sent_at: datetime
    responded_at: Optional[datetime] = None

    # Enriched fields
    event_title: str
    event_short_description: Optional[str] = None
    event_description: Optional[str] = None
    category_name: Optional[str] = None
    venue_name: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    organizer_name: Optional[str] = None
    organization_name: Optional[str] = None
    is_registered: bool = False


class AcceptInvitationResponse(BaseModel):
    message: str
    invitation_id: uuid.UUID
    event_id: uuid.UUID
    status: str
