"""Announcement service – create, list, delete event announcements and student feeds."""
from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.announcement import EventAnnouncement
from app.models.event import Event
from app.models.notification import Notification, NotificationType, RecipientType
from app.models.organizer import Organizer
from app.models.registration import Registration, RegistrationStatus
from app.schemas.announcement import EventAnnouncementCreate


async def create_announcement(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    data: EventAnnouncementCreate,
    db: AsyncSession,
) -> EventAnnouncement:
    """Create a new announcement for an event and notify registered students."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if event.organizer_id and event.organizer_id != organizer_id:
        raise ForbiddenError("You can only post announcements for your own events")

    announcement = EventAnnouncement(
        event_id=event_id,
        organizer_id=organizer_id,
        title=data.title,
        content=data.content,
        priority=data.priority,
        is_pinned=data.is_pinned,
    )
    db.add(announcement)
    await db.flush()

    # Dispatch in-app notifications to all registered students
    regs_result = await db.execute(
        select(Registration.student_id).where(
            and_(
                Registration.event_id == event_id,
                Registration.status.in_([
                    RegistrationStatus.confirmed,
                    RegistrationStatus.waitlisted,
                    RegistrationStatus.attended,
                ]),
            )
        )
    )
    student_ids = regs_result.scalars().all()

    for sid in student_ids:
        notif = Notification(
            recipient_id=sid,
            recipient_type=RecipientType.student,
            type=NotificationType.change if data.priority == "urgent" else NotificationType.general,
            title=f"[{event.title}] {data.title}",
            message=data.content[:280] + ("..." if len(data.content) > 280 else ""),
            metadata_={
                "event_id": str(event_id),
                "announcement_id": str(announcement.id),
                "priority": data.priority,
            },
            action_url=f"/events/{event_id}",
        )
        db.add(notif)

    await db.commit()
    await db.refresh(announcement)
    return announcement


async def get_event_announcements(
    event_id: uuid.UUID, db: AsyncSession
) -> List[EventAnnouncement]:
    """Get all announcements for a specific event."""
    result = await db.execute(
        select(EventAnnouncement)
        .where(EventAnnouncement.event_id == event_id)
        .order_by(desc(EventAnnouncement.is_pinned), desc(EventAnnouncement.created_at))
    )
    return list(result.scalars().all())


async def delete_announcement(
    announcement_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Delete an announcement if the organizer owns the event."""
    announcement = await db.get(EventAnnouncement, announcement_id)
    if not announcement:
        raise NotFoundError("EventAnnouncement", str(announcement_id))

    event = await db.get(Event, announcement.event_id)
    if event and event.organizer_id and event.organizer_id != organizer_id:
        raise ForbiddenError("You are not authorized to delete this announcement")

    await db.delete(announcement)
    await db.commit()


async def get_student_announcements(
    student_id: uuid.UUID, db: AsyncSession
) -> List[dict]:
    """Get all announcements from events the student is currently registered for."""
    # Find active event registrations
    reg_result = await db.execute(
        select(Registration.event_id).where(
            and_(
                Registration.student_id == student_id,
                Registration.status.in_([
                    RegistrationStatus.confirmed,
                    RegistrationStatus.waitlisted,
                    RegistrationStatus.attended,
                ]),
            )
        )
    )
    event_ids = list(set(reg_result.scalars().all()))
    if not event_ids:
        return []

    # Get announcements with event and organizer info
    result = await db.execute(
        select(EventAnnouncement, Event.title.label("event_title"), Organizer.organization_name)
        .join(Event, EventAnnouncement.event_id == Event.id)
        .outerjoin(Organizer, Event.organizer_id == Organizer.id)
        .where(EventAnnouncement.event_id.in_(event_ids))
        .order_by(desc(EventAnnouncement.is_pinned), desc(EventAnnouncement.created_at))
    )
    rows = result.all()

    items = []
    for ann, event_title, org_name in rows:
        items.append({
            "id": ann.id,
            "event_id": ann.event_id,
            "event_title": event_title,
            "organizer_name": org_name or "Event Organizer",
            "title": ann.title,
            "content": ann.content,
            "priority": ann.priority,
            "is_pinned": ann.is_pinned,
            "created_at": ann.created_at,
        })
    return items
