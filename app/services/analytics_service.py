"""Analytics service – live analytics, event analytics, organizer analytics."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.event import Event, EventStatus
from app.models.feedback import Feedback
from app.models.registration import Registration, RegistrationStatus
from app.models.student import Student
from app.schemas.analytics import (
    EventAnalytics,
    LiveAnalytics,
    OrganizerAnalytics,
    TimeSeriesPoint,
)


def _naive(dt: datetime) -> datetime:
    """Strip timezone info for SQLite-compatible queries (PostgreSQL ignores this)."""
    return dt.replace(tzinfo=None)


async def get_live_analytics(event_id: uuid.UUID, db: AsyncSession) -> LiveAnalytics:
    """Real-time analytics: registration count, utilization, trend."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise NotFoundError("Event", str(event_id))

    available = max(0, event.max_capacity - event.current_registrations)
    utilization = (
        (event.current_registrations / event.max_capacity * 100)
        if event.max_capacity > 0 else 0.0
    )

    # Hourly trend (last 24 hours)
    now = datetime.now(timezone.utc)
    hourly_trend: List[TimeSeriesPoint] = []
    for i in range(23, -1, -1):
        hour_start = now - timedelta(hours=i + 1)
        hour_end = now - timedelta(hours=i)
        count_result = await db.execute(
            select(func.count(Registration.id)).where(
                and_(
                    Registration.event_id == event_id,
                    Registration.registered_at >= _naive(hour_start),
                    Registration.registered_at < _naive(hour_end),
                    Registration.status != RegistrationStatus.cancelled,
                )
            )
        )
        hourly_trend.append(TimeSeriesPoint(timestamp=hour_end, value=float(count_result.scalar_one())))

    # Registration rate (last hour)
    last_hour_start = now - timedelta(hours=1)
    rate_result = await db.execute(
        select(func.count(Registration.id)).where(
            and_(
                Registration.event_id == event_id,
                Registration.registered_at >= _naive(last_hour_start),
                Registration.status != RegistrationStatus.cancelled,
            )
        )
    )
    registration_rate = float(rate_result.scalar_one())

    # Daily trend (last 7 days)
    daily_trend: List[TimeSeriesPoint] = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count_result = await db.execute(
            select(func.count(Registration.id)).where(
                and_(
                    Registration.event_id == event_id,
                    Registration.registered_at >= _naive(day_start),
                    Registration.registered_at < _naive(day_end),
                    Registration.status != RegistrationStatus.cancelled,
                )
            )
        )
        daily_trend.append(TimeSeriesPoint(timestamp=day_start, value=float(count_result.scalar_one())))

    # Status string
    reg_deadline = event.registration_deadline
    if reg_deadline.tzinfo is None:
        reg_deadline = reg_deadline.replace(tzinfo=timezone.utc)
    if event.status == EventStatus.cancelled:
        status_str = "cancelled"
    elif event.status == EventStatus.draft:
        status_str = "draft"
    elif event.current_registrations >= event.max_capacity:
        status_str = "full"
    elif now > reg_deadline:
        status_str = "closed"
    else:
        status_str = "open"

    return LiveAnalytics(
        event_id=event.id,
        event_title=event.title,
        current_registrations=event.current_registrations,
        max_capacity=event.max_capacity,
        available_seats=available,
        capacity_utilization=round(utilization, 2),
        registration_rate=registration_rate,
        hourly_trend=hourly_trend,
        daily_trend=daily_trend,
        status=status_str,
    )


async def get_event_analytics(
    event_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> EventAnalytics:
    """Full analytics for a single event (organizer access)."""
    result = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise NotFoundError("Event", str(event_id))
    if str(event.organizer_id) != str(organizer_id):
        raise ForbiddenError("You do not own this event")

    # Registration breakdown
    reg_result = await db.execute(
        select(Registration.status, func.count(Registration.id))
        .where(Registration.event_id == event_id)
        .group_by(Registration.status)
    )
    reg_counts: Dict[str, int] = {row[0].value: row[1] for row in reg_result.all()}

    confirmed = reg_counts.get("confirmed", 0) + reg_counts.get("attended", 0)
    cancelled = reg_counts.get("cancelled", 0)
    waitlisted = reg_counts.get("waitlisted", 0)
    total_regs = confirmed + cancelled + waitlisted
    attended = reg_counts.get("attended", 0)
    attendance_rate = (attended / confirmed * 100) if confirmed > 0 else 0.0

    # Daily registration trend (last 30 days or since event creation)
    now = datetime.now(timezone.utc)
    daily_trend: List[TimeSeriesPoint] = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count_result = await db.execute(
            select(func.count(Registration.id)).where(
                and_(
                    Registration.event_id == event_id,
                    Registration.registered_at >= day_start,
                    Registration.registered_at < day_end,
                )
            )
        )
        daily_trend.append(TimeSeriesPoint(timestamp=day_start, value=float(count_result.scalar_one())))

    # Demographics
    dept_result = await db.execute(
        select(Student.department, func.count(Student.id))
        .join(Registration, Registration.student_id == Student.id)
        .where(
            and_(
                Registration.event_id == event_id,
                Registration.status != RegistrationStatus.cancelled,
            )
        )
        .group_by(Student.department)
    )
    dept_breakdown: Dict[str, int] = {row[0]: row[1] for row in dept_result.all()}

    year_result = await db.execute(
        select(Student.year_of_study, func.count(Student.id))
        .join(Registration, Registration.student_id == Student.id)
        .where(
            and_(
                Registration.event_id == event_id,
                Registration.status != RegistrationStatus.cancelled,
            )
        )
        .group_by(Student.year_of_study)
    )
    year_breakdown: Dict[str, int] = {str(row[0]): row[1] for row in year_result.all()}

    # Feedback metrics
    fb_result = await db.execute(
        select(Feedback).where(Feedback.event_id == event_id)
    )
    feedbacks = list(fb_result.scalars().all())
    avg_rating = (sum(f.rating for f in feedbacks) / len(feedbacks)) if feedbacks else 0.0
    rating_dist: Dict[str, int] = {str(i): 0 for i in range(1, 6)}
    sentiment_dist: Dict[str, int] = {"positive": 0, "neutral": 0, "negative": 0}
    for f in feedbacks:
        rating_dist[str(f.rating)] = rating_dist.get(str(f.rating), 0) + 1
        if f.sentiment:
            sentiment_dist[f.sentiment.value] = sentiment_dist.get(f.sentiment.value, 0) + 1

    # Benchmarking: compare with similar events in same category
    cat_avg_result = await db.execute(
        select(func.avg(Feedback.rating))
        .join(Event, Event.id == Feedback.event_id)
        .where(
            and_(
                Event.category_id == event.category_id,
                Event.id != event_id,
                Event.status == EventStatus.completed,
            )
        )
    )
    cat_avg_rating = cat_avg_result.scalar_one()

    cat_reg_result = await db.execute(
        select(func.avg(Event.current_registrations))
        .where(
            and_(
                Event.category_id == event.category_id,
                Event.id != event_id,
                Event.status == EventStatus.completed,
            )
        )
    )
    cat_avg_regs = cat_reg_result.scalar_one()

    campus_avg_result = await db.execute(
        select(func.avg(Feedback.rating)).where(Event.id != event_id)
    )
    campus_avg_rating = campus_avg_result.scalar_one()

    campus_reg_result = await db.execute(
        select(func.avg(Event.current_registrations)).where(Event.id != event_id)
    )
    campus_avg_regs = campus_reg_result.scalar_one()

    return EventAnalytics(
        event_id=event.id,
        event_title=event.title,
        total_registrations=total_regs,
        confirmed_registrations=confirmed,
        cancelled_registrations=cancelled,
        waitlisted=waitlisted,
        attendance_rate=round(attendance_rate, 2),
        registration_trend=daily_trend,
        department_breakdown=dept_breakdown,
        year_breakdown=year_breakdown,
        avg_rating=round(avg_rating, 2),
        total_feedback=len(feedbacks),
        rating_distribution=rating_dist,
        sentiment_breakdown=sentiment_dist,
        category_avg_rating=round(float(cat_avg_rating), 2) if cat_avg_rating else None,
        category_avg_registrations=round(float(cat_avg_regs), 2) if cat_avg_regs else None,
        campus_avg_rating=round(float(campus_avg_rating), 2) if campus_avg_rating else None,
        campus_avg_registrations=round(float(campus_avg_regs), 2) if campus_avg_regs else None,
    )


async def get_organizer_analytics(
    organizer_id: uuid.UUID, db: AsyncSession
) -> OrganizerAnalytics:
    """Cross-event analytics for an organizer."""
    events_result = await db.execute(
        select(Event).where(Event.organizer_id == organizer_id)
    )
    events = list(events_result.scalars().all())

    total_events = len(events)
    published_events = sum(1 for e in events if e.status == EventStatus.published)
    completed_events = sum(1 for e in events if e.status == EventStatus.completed)
    total_registrations = sum(e.current_registrations for e in events)

    avg_utilization = (
        sum(
            (e.current_registrations / e.max_capacity * 100)
            for e in events if e.max_capacity > 0
        ) / total_events
    ) if total_events > 0 else 0.0

    # Average rating across all events
    event_ids = [e.id for e in events]
    avg_rating_result = await db.execute(
        select(func.avg(Feedback.rating)).where(Feedback.event_id.in_(event_ids))
    )
    avg_rating = float(avg_rating_result.scalar_one() or 0.0)

    # Top events
    top_events = sorted(events, key=lambda e: e.current_registrations, reverse=True)[:5]
    top_events_list = [
        {"id": str(e.id), "title": e.title, "registrations": e.current_registrations, "status": e.status.value}
        for e in top_events
    ]

    # Monthly trend (last 6 months)
    now = datetime.now(timezone.utc)
    monthly_trend: List[TimeSeriesPoint] = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        month_end = month_start + timedelta(days=30)
        count_result = await db.execute(
            select(func.count(Registration.id)).where(
                and_(
                    Registration.event_id.in_(event_ids),
                    Registration.registered_at >= month_start,
                    Registration.registered_at < month_end,
                    Registration.status != RegistrationStatus.cancelled,
                )
            )
        )
        monthly_trend.append(
            TimeSeriesPoint(timestamp=month_start, value=float(count_result.scalar_one()))
        )

    # Category breakdown
    cat_result = await db.execute(
        select(Event.category_id, func.count(Event.id))
        .where(Event.organizer_id == organizer_id)
        .group_by(Event.category_id)
    )
    category_breakdown: Dict[str, int] = {
        str(row[0]): row[1] for row in cat_result.all()
    }

    return OrganizerAnalytics(
        organizer_id=organizer_id,
        total_events=total_events,
        published_events=published_events,
        completed_events=completed_events,
        total_registrations=total_registrations,
        avg_capacity_utilization=round(avg_utilization, 2),
        avg_rating=round(avg_rating, 2),
        top_events=top_events_list,
        monthly_trend=monthly_trend,
        category_breakdown=category_breakdown,
    )
