"""Student dashboard + personalized recommendations."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, OrganizerToken, StudentToken
from app.models.bookmark import Bookmark
from app.models.event import Event, EventStatus
from app.models.registration import Registration, RegistrationStatus
from app.schemas.student import StudentResponse
from app.schemas.organizer import OrganizerResponse
from app.services.analytics_service import get_organizer_analytics

router = APIRouter(tags=["Dashboards"])


@router.get("/students/me/dashboard", summary="Student personalized dashboard")
async def student_dashboard(token: StudentToken, db: DBSession):
    """Returns recommended, upcoming, registered, and bookmarked events."""
    student_id = uuid.UUID(token["sub"])
    now = datetime.now(timezone.utc)

    # Upcoming registered events
    upcoming_result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.event).options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.venue),
            )
        )
        .where(
            and_(
                Registration.student_id == student_id,
                Registration.status.in_([RegistrationStatus.confirmed, RegistrationStatus.waitlisted]),
            )
        )
        .order_by(Registration.registered_at.desc())
        .limit(5)
    )
    upcoming_regs = list(upcoming_result.scalars().all())
    def _tz(dt):
        return dt.replace(tzinfo=timezone.utc) if dt and dt.tzinfo is None else dt

    upcoming_events = [r.event for r in upcoming_regs if r.event and _tz(r.event.start_datetime) > now]

    # Recent bookmarks
    bookmarks_result = await db.execute(
        select(Bookmark)
        .options(
            selectinload(Bookmark.event).options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.venue),
            )
        )
        .where(Bookmark.student_id == student_id)
        .order_by(Bookmark.created_at.desc())
        .limit(5)
    )
    bookmarked = [b.event for b in bookmarks_result.scalars().all() if b.event]

    # Recommended events (featured published events not yet registered for)
    registered_event_ids = {str(r.event_id) for r in upcoming_regs}
    recommended_result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(
            and_(
                Event.status == EventStatus.published,
                Event.start_datetime > now,
            )
        )
        .order_by(Event.is_featured.desc(), Event.start_datetime.asc())
        .limit(10)
    )
    all_upcoming = list(recommended_result.scalars().all())
    recommended = [e for e in all_upcoming if str(e.id) not in registered_event_ids][:5]

    # Stats
    total_regs_result = await db.execute(
        select(Registration).where(Registration.student_id == student_id)
    )
    all_regs = list(total_regs_result.scalars().all())

    bookmarks_count_result = await db.execute(
        select(Bookmark).where(Bookmark.student_id == student_id)
    )
    all_bookmarks = list(bookmarks_count_result.scalars().all())

    return {
        "upcoming_events": upcoming_events,
        "recommended_events": recommended,
        "bookmarked_events": bookmarked,
        "stats": {
            "total_registrations": len(all_regs),
            "confirmed": sum(1 for r in all_regs if r.status == RegistrationStatus.confirmed),
            "attended": sum(1 for r in all_regs if r.status == RegistrationStatus.attended),
            "bookmarks": len(all_bookmarks),
        },
    }


@router.get("/organizers/me/dashboard", summary="Organizer dashboard with analytics")
async def organizer_dashboard(token: OrganizerToken, db: DBSession):
    """Returns cross-event analytics for the organizer."""
    organizer_id = uuid.UUID(token["sub"])
    analytics = await get_organizer_analytics(organizer_id, db)

    # Recent events
    from app.models.event import Event
    events_result = await db.execute(
        select(Event)
        .options(selectinload(Event.category), selectinload(Event.venue))
        .where(Event.organizer_id == organizer_id)
        .order_by(Event.created_at.desc())
        .limit(5)
    )
    recent_events = list(events_result.scalars().all())

    return {
        "analytics": analytics,
        "recent_events": [
            {
                "id": str(e.id),
                "title": e.title,
                "status": e.status.value,
                "start_datetime": e.start_datetime.isoformat(),
                "end_datetime": e.end_datetime.isoformat() if e.end_datetime else None,
                "current_registrations": e.current_registrations,
                "max_capacity": e.max_capacity,
                "available_seats": e.available_seats,
                "registrations": e.current_registrations,
                "capacity": e.max_capacity,
                "start": e.start_datetime.isoformat(),
                "category": {"name": e.category.name if e.category else "Campus event"},
                "venue": {"name": e.venue.name if e.venue else "Campus venue"},
            }
            for e in recent_events
        ],
    }
