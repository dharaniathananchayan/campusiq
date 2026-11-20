"""Student Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    institute_name: Optional[str] = Field(default=None, max_length=255)
    department: Optional[str] = Field(default=None, max_length=100)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=5)
    phone: Optional[str] = Field(default=None, max_length=20)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=1000)


class StudentPublicResponse(BaseModel):
    """Minimal public-facing student data (e.g., in event attendee lists)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    institute_name: Optional[str] = None
    department: Optional[str] = None
    year_of_study: int
    profile_picture_url: Optional[str] = None


class StudentResponse(BaseModel):
    """Full student profile (returned to the authenticated student)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    institute_name: Optional[str] = None
    student_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: int
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
