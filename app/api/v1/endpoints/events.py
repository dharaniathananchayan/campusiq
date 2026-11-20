"""Event CRUD + discovery + live analytics endpoints."""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DBSession, OrganizerToken, StudentToken, AnyUserToken
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.event import Event, EventStatus
from app.models.bookmark import Bookmark
from app.models.registration import Registration, RegistrationStatus
from app.models.student import Student
from app.models.organizer import Organizer
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.event import EventCreate, EventResponse, EventSearchFilters, EventUpdate
from app.schemas.analytics import LiveAnalytics
from app.schemas.announcement import EventAnnouncementCreate, EventAnnouncementResponse
from app.schemas.forum import ForumMessageCreate, ForumMessageResponse, ForumControlsUpdate, ForumMemberResponse, RemoveMemberRequest
from app.services import announcement_service, event_service, forum_service
from app.services.analytics_service import get_live_analytics
from app.services.ai.gemini_client import get_embedding

router = APIRouter(prefix="/events", tags=["Events"])


def _enrich_event(event: Event) -> dict:
    """Compute available_seats for response."""
    return {
        **{c.name: getattr(event, c.name) for c in event.__table__.columns},
        "available_seats": event.available_seats,
    }


async def _get_context_flags(
    event_id: uuid.UUID,
    student_id: Optional[uuid.UUID],
    db,
) -> tuple[Optional[bool], Optional[bool]]:
    """Check if student is registered/bookmarked for an event."""
    if not student_id:
        return None, None
    reg = await db.execute(
        select(Registration).where(
            Registration.student_id == student_id,
            Registration.event_id == event_id,
            Registration.status.in_([RegistrationStatus.confirmed, RegistrationStatus.attended, RegistrationStatus.waitlisted]),
        )
    )
    bm = await db.execute(
        select(Bookmark).where(
            Bookmark.student_id == student_id,
            Bookmark.event_id == event_id,
        )
    )
    return reg.scalars().first() is not None, bm.scalars().first() is not None


# ── Organizer: Event CRUD ──────────────────────────────────────────────────────

@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event (organizer)",
)
async def create_event(data: EventCreate, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    event = await event_service.create_event(organizer_id, data, db)
    # Generate and store embedding asynchronously (best-effort)
    try:
        text = f"{event.title}. {event.description[:500]}"
        embedding = await get_embedding(text)
        event.embedding = embedding
        await db.commit()
    except Exception:
        pass
    event = await event_service.get_event_by_id(event.id, db)
    return event


@router.get("/my", summary="Get my events (organizer)", response_model=PaginatedResponse)
async def my_events(
    token: OrganizerToken,
    db: DBSession,
    status_filter: Optional[EventStatus] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    organizer_id = uuid.UUID(token["sub"])
    return await event_service.get_organizer_events(
        organizer_id, db, status=status_filter, page=page, page_size=page_size
    )


@router.put("/{event_id}", response_model=EventResponse, summary="Update an event (organizer)")
async def update_event(
    event_id: uuid.UUID, data: EventUpdate, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    event = await event_service.update_event(event_id, organizer_id, data, db)
    return await event_service.get_event_by_id(event.id, db)


@router.post(
    "/{event_id}/publish",
    response_model=EventResponse,
    summary="Publish an event (organizer)",
)
async def publish_event(event_id: uuid.UUID, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    event = await event_service.publish_event(event_id, organizer_id, db)
    return await event_service.get_event_by_id(event.id, db)


@router.post(
    "/{event_id}/cancel",
    response_model=EventResponse,
    summary="Cancel an event (organizer)",
)
async def cancel_event(event_id: uuid.UUID, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    event = await event_service.cancel_event(event_id, organizer_id, db)
    return await event_service.get_event_by_id(event.id, db)


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Delete a draft event (organizer)",
)
async def delete_event(event_id: uuid.UUID, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    await event_service.delete_event(event_id, organizer_id, db)
    return MessageResponse(message="Event deleted successfully")


# ── Public: Event Discovery ────────────────────────────────────────────────────

@router.get("", summary="List / search published events")
async def list_events(
    db: DBSession,
    q: Optional[str] = Query(default=None),
    category_id: Optional[uuid.UUID] = Query(default=None),
    venue_id: Optional[uuid.UUID] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    is_featured: Optional[bool] = Query(default=None),
    has_seats_available: Optional[bool] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    from datetime import date as _date
    filters = EventSearchFilters(
        q=q,
        category_id=category_id,
        venue_id=venue_id,
        start_date=_date.fromisoformat(start_date) if start_date else None,
        end_date=_date.fromisoformat(end_date) if end_date else None,
        is_featured=is_featured,
        has_seats_available=has_seats_available,
        tags=tags,
        page=page,
        page_size=page_size,
        status=EventStatus.published,
    )
    return await event_service.list_events(filters, db)


@router.get("/featured", summary="Get featured events")
async def featured_events(db: DBSession):
    filters = EventSearchFilters(is_featured=True, status=EventStatus.published)
    return await event_service.list_events(filters, db)


@router.get("/{event_id}", response_model=EventResponse, summary="Get event detail")
async def get_event(event_id: uuid.UUID, db: DBSession):
    return await event_service.get_event_by_id(event_id, db)


# ── Milestone 1 Advanced: Live Analytics ──────────────────────────────────────

@router.get(
    "/{event_id}/analytics/live",
    response_model=LiveAnalytics,
    summary="[Organizer] Real-time registration analytics for an event",
)
async def live_event_analytics(
    event_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    return await get_live_analytics(event_id, db)


# ── Event Insights: Registration Control & Announcements ──────────────────────

@router.post(
    "/{event_id}/toggle-registration",
    response_model=EventResponse,
    summary="Toggle or set event registration open/closed status (organizer)",
)
async def toggle_registration(
    event_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
    is_open: Optional[bool] = Query(default=None),
):
    organizer_id = uuid.UUID(token["sub"])
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))
    if event.organizer_id and event.organizer_id != organizer_id:
        raise ForbiddenError("You can only change registration status for your own events")

    if is_open is not None:
        event.is_registration_open = is_open
    else:
        event.is_registration_open = not event.is_registration_open

    await db.commit()
    return await event_service.get_event_by_id(event.id, db)


@router.get(
    "/{event_id}/announcements",
    response_model=list[EventAnnouncementResponse],
    summary="List announcements for an event",
)
async def list_event_announcements(event_id: uuid.UUID, db: DBSession):
    return await announcement_service.get_event_announcements(event_id, db)


@router.post(
    "/{event_id}/announcements",
    response_model=EventAnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post an announcement for an event (organizer)",
)
async def post_event_announcement(
    event_id: uuid.UUID,
    data: EventAnnouncementCreate,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    return await announcement_service.create_announcement(event_id, organizer_id, data, db)


@router.delete(
    "/{event_id}/announcements/{announcement_id}",
    response_model=MessageResponse,
    summary="Delete an announcement (organizer)",
)
async def remove_event_announcement(
    event_id: uuid.UUID,
    announcement_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    await announcement_service.delete_announcement(announcement_id, organizer_id, db)
    return MessageResponse(message="Announcement deleted successfully")


# ── Event Lifecycle: Archive ──────────────────────────────────────────────────

@router.post(
    "/{event_id}/archive",
    response_model=EventResponse,
    summary="Archive an event (organizer)",
)
async def archive_event(
    event_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    event = await event_service.archive_event(event_id, organizer_id, db)
    return _enrich_event(event)


# ── Student Forum Q&A Chat Room ───────────────────────────────────────────────

@router.get(
    "/{event_id}/forum",
    response_model=list[ForumMessageResponse],
    summary="List all queries and messages in the Student Forum for this event",
)
async def list_forum_messages(
    event_id: str,
    db: DBSession,
):
    try:
        event_uuid = uuid.UUID(event_id)
    except (ValueError, AttributeError):
        return []
    return await forum_service.list_forum_messages(event_uuid, db)


@router.post(
    "/{event_id}/forum",
    response_model=ForumMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a question or reply to the event's Student Forum (students & organizers)",
)
async def post_forum_message(
    event_id: str,
    data: ForumMessageCreate,
    token: AnyUserToken,
    db: DBSession,
):
    try:
        event_uuid = uuid.UUID(event_id)
    except (ValueError, AttributeError):
        raise NotFoundError("Event", event_id)

    user_id = uuid.UUID(token["sub"])
    role = token.get("role", "student")

    # Resolve display name
    user_name = "Anonymous"
    if role == "student":
        student = await db.get(Student, user_id)
        if student:
            user_name = student.full_name
    elif role == "organizer":
        organizer = await db.get(Organizer, user_id)
        if organizer:
            user_name = organizer.organization_name or organizer.full_name

    return await forum_service.post_forum_message(
        event_id=event_uuid,
        user_id=user_id,
        user_role=role,
        user_name=user_name,
        message=data.message,
        db=db,
    )


@router.put(
    "/{event_id}/forum-controls",
    response_model=EventResponse,
    summary="Update forum controls (enablement, access mode) for an event (organizer)",
)
async def update_event_forum_controls(
    event_id: uuid.UUID,
    data: ForumControlsUpdate,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    event = await forum_service.update_forum_controls(
        event_id=event_id,
        organizer_id=organizer_id,
        has_student_forum=data.has_student_forum,
        forum_access_mode=data.forum_access_mode,
        db=db,
    )
    return await event_service.get_event_by_id(event.id, db)


@router.get(
    "/{event_id}/forum-members",
    response_model=List[ForumMemberResponse],
    summary="List all forum participants and moderation status (organizer)",
)
async def list_forum_members(
    event_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    return await forum_service.list_forum_members(event_id, organizer_id, db)


@router.post(
    "/{event_id}/forum-members/{user_id}/remove",
    response_model=MessageResponse,
    summary="Remove / ban a user from the event's student forum (organizer)",
)
async def remove_forum_member(
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
    data: Optional[RemoveMemberRequest] = None,
):
    organizer_id = uuid.UUID(token["sub"])
    reason = data.reason if data and data.reason else "Removed by event organizer"
    res = await forum_service.remove_forum_member(
        event_id=event_id,
        target_user_id=user_id,
        organizer_id=organizer_id,
        reason=reason,
        db=db,
    )
    return MessageResponse(message=res["message"])


@router.delete(
    "/{event_id}/forum-messages/{message_id}",
    response_model=MessageResponse,
    summary="Delete a message from the student forum (organizer)",
)
async def delete_forum_message(
    event_id: uuid.UUID,
    message_id: uuid.UUID,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    res = await forum_service.delete_forum_message(
        event_id=event_id,
        message_id=message_id,
        organizer_id=organizer_id,
        db=db,
    )
    return MessageResponse(message=res["message"])

