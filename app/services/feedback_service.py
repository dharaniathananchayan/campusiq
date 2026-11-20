"""Feedback, Bookmark, and Notification services."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.bookmark import Bookmark
from app.models.event import Event, EventStatus
from app.models.feedback import Feedback
from app.models.notification import Notification, NotificationType, RecipientType
from app.models.registration import Registration, RegistrationStatus
from app.schemas.registration import FeedbackCreate, FeedbackSummary


# ── Feedback ──────────────────────────────────────────────────────────────────

async def submit_feedback(
    student_id: uuid.UUID,
    event_id: uuid.UUID,
    data: FeedbackCreate,
    db: AsyncSession,
) -> Feedback:
    """Submit student feedback for an event they attended/registered for."""
    # Check event exists
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    # Verify student was registered
    reg_result = await db.execute(
        select(Registration).where(
            and_(
                Registration.student_id == student_id,
                Registration.event_id == event_id,
                Registration.status.in_([RegistrationStatus.confirmed, RegistrationStatus.attended]),
            )
        )
    )
    if not reg_result.scalars().first():
        raise ForbiddenError("You must be registered for this event to submit feedback")

    # Check event has started
    now = datetime.now(timezone.utc)
    if event.start_datetime > now:
        raise ValidationError("You can only submit feedback after the event has started")

    # Duplicate check
    existing = await db.execute(
        select(Feedback).where(
            and_(Feedback.student_id == student_id, Feedback.event_id == event_id)
        )
    )
    if existing.scalars().first():
        raise ConflictError("You have already submitted feedback for this event")

    feedback = Feedback(
        student_id=student_id,
        event_id=event_id,
        rating=data.rating,
        comment=data.comment,
        is_anonymous=data.is_anonymous,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


async def get_event_feedback(
    event_id: uuid.UUID,
    db: AsyncSession,
    organizer_view: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> list[Feedback]:
    query = (
        select(Feedback)
        .options(selectinload(Feedback.student))
        .where(Feedback.event_id == event_id)
        .order_by(Feedback.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_feedback_summary(event_id: uuid.UUID, db: AsyncSession) -> FeedbackSummary:
    result = await db.execute(
        select(Feedback).where(Feedback.event_id == event_id)
    )
    feedbacks = list(result.scalars().all())

    if not feedbacks:
        return FeedbackSummary(
            avg_rating=0.0,
            total_count=0,
            rating_distribution={str(i): 0 for i in range(1, 6)},
            sentiment_breakdown={"positive": 0, "neutral": 0, "negative": 0},
        )

    total = len(feedbacks)
    avg_rating = sum(f.rating for f in feedbacks) / total
    rating_dist = {str(i): 0 for i in range(1, 6)}
    sentiment_dist = {"positive": 0, "neutral": 0, "negative": 0}

    for f in feedbacks:
        rating_dist[str(f.rating)] = rating_dist.get(str(f.rating), 0) + 1
        if f.sentiment:
            sentiment_dist[f.sentiment.value] = sentiment_dist.get(f.sentiment.value, 0) + 1

    return FeedbackSummary(
        avg_rating=round(avg_rating, 2),
        total_count=total,
        rating_distribution=rating_dist,
        sentiment_breakdown=sentiment_dist,
    )


# ── Bookmarks ─────────────────────────────────────────────────────────────────

async def add_bookmark(
    student_id: uuid.UUID, event_id: uuid.UUID, db: AsyncSession
) -> Bookmark:
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))

    existing = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.student_id == student_id, Bookmark.event_id == event_id)
        )
    )
    if existing.scalars().first():
        raise ConflictError("Event is already bookmarked")

    bookmark = Bookmark(student_id=student_id, event_id=event_id)
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return bookmark


async def remove_bookmark(
    student_id: uuid.UUID, event_id: uuid.UUID, db: AsyncSession
) -> None:
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.student_id == student_id, Bookmark.event_id == event_id)
        )
    )
    bookmark = result.scalars().first()
    if not bookmark:
        raise NotFoundError("Bookmark")
    await db.delete(bookmark)
    await db.commit()


async def get_student_bookmarks(
    student_id: uuid.UUID, db: AsyncSession, page: int = 1, page_size: int = 20
) -> list[Bookmark]:
    result = await db.execute(
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
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all())


async def is_bookmarked(student_id: uuid.UUID, event_id: uuid.UUID, db: AsyncSession) -> bool:
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.student_id == student_id, Bookmark.event_id == event_id)
        )
    )
    return result.scalars().first() is not None


# ── Notifications ─────────────────────────────────────────────────────────────

async def create_notification(
    recipient_id: uuid.UUID,
    recipient_type: RecipientType,
    notif_type: NotificationType,
    title: str,
    message: str,
    db: AsyncSession,
    metadata: Optional[dict] = None,
    action_url: Optional[str] = None,
) -> Notification:
    notif = Notification(
        recipient_id=recipient_id,
        recipient_type=recipient_type,
        type=notif_type,
        title=title,
        message=message,
        metadata_=metadata or {},
        action_url=action_url,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_notifications(
    user_id: uuid.UUID,
    recipient_type: RecipientType,
    db: AsyncSession,
    is_read: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Notification], int]:
    query = select(Notification).where(
        and_(
            Notification.recipient_id == user_id,
            Notification.recipient_type == recipient_type,
        )
    )
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(Notification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def mark_notification_read(
    notification_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> Notification:
    notif = await db.get(Notification, notification_id)
    if not notif:
        raise NotFoundError("Notification")
    if str(notif.recipient_id) != str(user_id):
        raise ForbiddenError("Not your notification")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_read(
    user_id: uuid.UUID, recipient_type: RecipientType, db: AsyncSession
) -> int:
    """Mark all unread notifications as read. Returns count updated."""
    from sqlalchemy import update
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.recipient_id == user_id,
                Notification.recipient_type == recipient_type,
                Notification.is_read == False,
            )
        )
    )
    notifications = list(result.scalars().all())
    count = 0
    for n in notifications:
        n.is_read = True
        count += 1
    await db.commit()
    return count


async def get_unread_count(
    user_id: uuid.UUID, recipient_type: RecipientType, db: AsyncSession
) -> int:
    result = await db.execute(
        select(func.count(Notification.id)).where(
            and_(
                Notification.recipient_id == user_id,
                Notification.recipient_type == recipient_type,
                Notification.is_read == False,
            )
        )
    )
    return result.scalar_one()
