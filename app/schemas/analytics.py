"""Analytics Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None


class LiveAnalytics(BaseModel):
    event_id: uuid.UUID
    event_title: str
    current_registrations: int
    max_capacity: int
    available_seats: int
    capacity_utilization: float  # 0–100 percentage
    registration_rate: float  # registrations per hour (last 24h)
    hourly_trend: List[TimeSeriesPoint]
    daily_trend: List[TimeSeriesPoint]
    status: str  # open | full | closed | draft | cancelled


class EventAnalytics(BaseModel):
    event_id: uuid.UUID
    event_title: str
    # Registration metrics
    total_registrations: int
    confirmed_registrations: int
    cancelled_registrations: int
    waitlisted: int
    attendance_rate: float
    # Trends
    registration_trend: List[TimeSeriesPoint]  # daily
    # Demographics
    department_breakdown: Dict[str, int]
    year_breakdown: Dict[str, int]
    # Feedback metrics
    avg_rating: float
    total_feedback: int
    rating_distribution: Dict[str, int]
    sentiment_breakdown: Dict[str, int]
    # Benchmarks
    category_avg_rating: Optional[float] = None
    category_avg_registrations: Optional[float] = None
    campus_avg_rating: Optional[float] = None
    campus_avg_registrations: Optional[float] = None


class OrganizerAnalytics(BaseModel):
    organizer_id: uuid.UUID
    total_events: int
    published_events: int
    completed_events: int
    total_registrations: int
    avg_capacity_utilization: float
    avg_rating: float
    top_events: List[Dict]  # [{title, registrations, rating}]
    monthly_trend: List[TimeSeriesPoint]
    category_breakdown: Dict[str, int]
