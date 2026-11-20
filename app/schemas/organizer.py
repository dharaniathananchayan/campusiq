"""Organizer Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrganizerUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    organization_name: Optional[str] = Field(default=None, max_length=255)
    organization_type: Optional[str] = Field(default=None)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    website: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=2000)
    logo_url: Optional[str] = Field(default=None, max_length=500)


class OrganizerPublicResponse(BaseModel):
    """Minimal public organizer info shown on event cards."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    organization_name: str
    organization_type: str
    logo_url: Optional[str] = None
    is_verified: bool


class OrganizerResponse(BaseModel):
    """Full organizer profile returned to authenticated organizer."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    organization_name: str
    organization_type: str
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_verified: bool
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
