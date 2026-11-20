"""Forum service – manage Student Forum Q&A chat room messages, controls, and moderation."""
from __future__ import annotations

import uuid
from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.event import Event
from app.models.forum import EventForumMessage
from app.models.forum_moderation import EventForumRemovedMember
from app.models.registration import Registration, RegistrationStatus


async def list_forum_messages(
    event_id: uuid.UUID, db: AsyncSession
) -> List[EventForumMessage]:
    """Retrieve all chat messages/queries in the event's Student Forum."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if not event.has_student_forum:
        return []

    result = await db.execute(
        select(EventForumMessage)
        .where(EventForumMessage.event_id == event_id)
        .order_by(EventForumMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def post_forum_message(
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    user_role: str,
    user_name: str,
    message: str,
    db: AsyncSession,
) -> EventForumMessage:
    """Post a question or reply to the event's Student Forum."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if not event.has_student_forum:
        raise ValidationError("Student Forum is not enabled for this event")

    # 1. Check access mode: organizer_only restricts students
    access_mode = getattr(event, "forum_access_mode", "open")
    if access_mode == "organizer_only" and user_role == "student":
        raise ForbiddenError("This student forum is currently in organizer-only mode. Only event leads can post updates.")

    # 2. Check if student is removed/banned from this forum
    removed_check = await db.execute(
        select(EventForumRemovedMember).where(
            and_(
                EventForumRemovedMember.event_id == event_id,
                EventForumRemovedMember.user_id == user_id,
            )
        )
    )
    if removed_check.scalars().first():
        raise ForbiddenError("You have been removed from this event's student forum by the organizer.")

    clean_message = message.strip()
    if not clean_message:
        raise ValidationError("Message cannot be empty")

    forum_message = EventForumMessage(
        event_id=event_id,
        user_id=user_id,
        user_role=user_role,
        user_name=user_name,
        message=clean_message,
    )
    db.add(forum_message)
    await db.commit()
    await db.refresh(forum_message)
    return forum_message


async def update_forum_controls(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    has_student_forum: Optional[bool],
    forum_access_mode: Optional[str],
    db: AsyncSession,
) -> Event:
    """Update event forum enablement and access permissions."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if event.organizer_id != organizer_id:
        raise ForbiddenError("You can only manage controls for your own events")

    if has_student_forum is not None:
        event.has_student_forum = has_student_forum
    if forum_access_mode is not None:
        event.forum_access_mode = forum_access_mode

    await db.commit()
    await db.refresh(event)
    return event


async def list_forum_members(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> List[dict]:
    """List all participants in this event's forum (posters & registered attendees) with status."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if event.organizer_id != organizer_id:
        raise ForbiddenError("You can only view forum members for your own events")

    # Get removed members
    removed_result = await db.execute(
        select(EventForumRemovedMember).where(EventForumRemovedMember.event_id == event_id)
    )
    removed_map = {str(rm.user_id): rm for rm in removed_result.scalars().all()}

    # Group forum messages by user
    msg_stats = await db.execute(
        select(
            EventForumMessage.user_id,
            EventForumMessage.user_name,
            EventForumMessage.user_role,
            func.count(EventForumMessage.id).label("count"),
            func.max(EventForumMessage.created_at).label("last_active"),
        )
        .where(EventForumMessage.event_id == event_id)
        .group_by(EventForumMessage.user_id, EventForumMessage.user_name, EventForumMessage.user_role)
    )

    members = []
    seen_ids = set()
    for uid, uname, urole, count, last_active in msg_stats.all():
        uid_str = str(uid)
        seen_ids.add(uid_str)
        is_rem = uid_str in removed_map
        members.append({
            "user_id": uid,
            "user_name": uname,
            "user_role": urole,
            "message_count": count,
            "last_active": last_active or datetime.now(timezone.utc),
            "is_removed": is_rem,
        })

    # Also list registered students who haven't posted yet if any were removed
    for uid_str, rm in removed_map.items():
        if uid_str not in seen_ids:
            members.append({
                "user_id": rm.user_id,
                "user_name": rm.user_name,
                "user_role": "student",
                "message_count": 0,
                "last_active": rm.created_at,
                "is_removed": True,
            })

    return members


async def remove_forum_member(
    event_id: uuid.UUID,
    target_user_id: uuid.UUID,
    organizer_id: uuid.UUID,
    reason: str,
    db: AsyncSession,
) -> dict:
    """Remove / ban a user from participating in this event's student forum."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if event.organizer_id != organizer_id:
        raise ForbiddenError("You can only manage members for your own events")

    # Find the user's name from recent messages or student table
    name_check = await db.execute(
        select(EventForumMessage.user_name).where(
            and_(
                EventForumMessage.event_id == event_id,
                EventForumMessage.user_id == target_user_id,
            )
        ).limit(1)
    )
    user_name = name_check.scalar_one_or_none() or "Student Member"

    # Check if already removed
    existing = await db.execute(
        select(EventForumRemovedMember).where(
            and_(
                EventForumRemovedMember.event_id == event_id,
                EventForumRemovedMember.user_id == target_user_id,
            )
        )
    )
    if existing.scalars().first():
        return {"message": "User is already removed from this forum", "user_id": target_user_id}

    removal = EventForumRemovedMember(
        event_id=event_id,
        user_id=target_user_id,
        user_name=user_name,
        removed_by_id=organizer_id,
        reason=reason,
    )
    db.add(removal)
    await db.commit()
    return {"message": f"Successfully removed {user_name} from the forum", "user_id": target_user_id}


async def delete_forum_message(
    event_id: uuid.UUID,
    message_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Delete a message from the student forum."""
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    if event.organizer_id != organizer_id:
        raise ForbiddenError("You can only delete messages in your own events")

    message = await db.get(EventForumMessage, message_id)
    if not message or message.event_id != event_id:
        raise NotFoundError("ForumMessage", str(message_id))

    await db.delete(message)
    await db.commit()
    return {"message": "Message deleted successfully", "message_id": message_id}
