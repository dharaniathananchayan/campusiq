"""Event Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.event import EventStatus
from app.schemas.organizer import OrganizerPublicResponse
from app.schemas.venue import CategoryResponse, VenueResponse


class EligibilityCriteria(BaseModel):
    departments: List[str] = Field(default_factory=list)
    year_of_study: List[int] = Field(default_factory=list)  # e.g. [1, 2, 3]
    custom_criteria: str = ""


class EventCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=20)
    short_description: Optional[str] = Field(default=None, max_length=500)
    category_id: uuid.UUID
    venue_id: Optional[uuid.UUID] = None
    start_datetime: datetime
    end_datetime: datetime
    registration_deadline: datetime
    max_capacity: int = Field(ge=1, le=100000)
    eligibility_criteria: EligibilityCriteria = Field(default_factory=EligibilityCriteria)
    tags: List[str] = Field(default_factory=list)
    banner_url: Optional[str] = Field(default=None, max_length=500)
    is_featured: bool = False
    registration_fee: float = Field(default=0.0, ge=0.0)
    contact_email: Optional[EmailStr] = None
    has_student_forum: bool = False
    forum_access_mode: str = "open"
    status: Optional[EventStatus] = None

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        if self.registration_deadline >= self.start_datetime:
            raise ValueError("registration_deadline must be before start_datetime")
        return self


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=5, max_length=255)
    description: Optional[str] = Field(default=None, min_length=20)
    short_description: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[uuid.UUID] = None
    venue_id: Optional[uuid.UUID] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    max_capacity: Optional[int] = Field(default=None, ge=1)
    eligibility_criteria: Optional[EligibilityCriteria] = None
    tags: Optional[List[str]] = None
    banner_url: Optional[str] = None
    is_featured: Optional[bool] = None
    registration_fee: Optional[float] = Field(default=None, ge=0.0)
    contact_email: Optional[EmailStr] = None
    is_registration_open: Optional[bool] = None
    has_student_forum: Optional[bool] = None
    forum_access_mode: Optional[str] = None
    status: Optional[EventStatus] = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    short_description: Optional[str] = None
    organizer: Optional[OrganizerPublicResponse] = None
    category: Optional[CategoryResponse] = None
    venue: Optional[VenueResponse] = None
    start_datetime: datetime
    end_datetime: datetime
    registration_deadline: datetime
    max_capacity: int
    current_registrations: int
    available_seats: int
    status: EventStatus
    eligibility_criteria: dict
    tags: List[str]
    banner_url: Optional[str] = None
    is_featured: bool
    registration_fee: float
    contact_email: Optional[str] = None
    is_registration_open: bool = True
    has_student_forum: bool = False
    forum_access_mode: str = "open"
    created_at: datetime
    updated_at: datetime
    # Contextual (set in service layer based on requesting student)
    is_registered: Optional[bool] = None
    is_bookmarked: Optional[bool] = None
    match_score: Optional[float] = None


class EventListResponse(BaseModel):
    """Lighter version used in lists and dashboards."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    short_description: Optional[str] = None
    organizer: Optional[OrganizerPublicResponse] = None
    category: Optional[CategoryResponse] = None
    venue: Optional[VenueResponse] = None
    start_datetime: datetime
    end_datetime: datetime
    registration_deadline: datetime
    max_capacity: int
    current_registrations: int
    available_seats: int
    status: EventStatus
    tags: List[str]
    banner_url: Optional[str] = None
    is_featured: bool
    registration_fee: float
    is_registration_open: bool = True
    has_student_forum: bool = False
    forum_access_mode: str = "open"
    is_registered: Optional[bool] = None
    is_bookmarked: Optional[bool] = None
    match_score: Optional[float] = None


class EventSearchFilters(BaseModel):
    q: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    venue_id: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[EventStatus] = EventStatus.published
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    has_seats_available: Optional[bool] = None
    min_capacity: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
