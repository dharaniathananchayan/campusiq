"""Category and Venue Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color_hex: Optional[str] = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color_hex: Optional[str] = None
    is_active: bool
    created_at: datetime


# ── Venue ─────────────────────────────────────────────────────────────────────

class VenueCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    building: Optional[str] = Field(default=None, max_length=100)
    floor: Optional[str] = Field(default=None, max_length=50)
    location_description: Optional[str] = None
    capacity: int = Field(ge=1)
    amenities: Dict = Field(default_factory=dict)
    is_available: bool = True


class VenueUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    building: Optional[str] = None
    floor: Optional[str] = None
    location_description: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    amenities: Optional[Dict] = None
    is_available: Optional[bool] = None


class VenueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    building: Optional[str] = None
    floor: Optional[str] = None
    location_description: Optional[str] = None
    capacity: int
    amenities: Dict
    is_available: bool
    created_at: datetime
