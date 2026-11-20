"""Notification endpoints."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Query

from app.core.dependencies import DBSession, AnyUserToken
from app.models.notification import RecipientType
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.registration import NotificationResponse
from app.services.feedback_service import (
    get_notifications,
    get_unread_count,
    mark_all_read,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Get my notifications")
async def list_notifications(
    token: AnyUserToken,
    db: DBSession,
    is_read: Optional[bool] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    user_id = uuid.UUID(token["sub"])
    role = token["role"]
    recipient_type = RecipientType.student if role == "student" else RecipientType.organizer
    notifications, total = await get_notifications(
        user_id, recipient_type, db, is_read=is_read, page=page, page_size=page_size
    )
    return PaginatedResponse.create(
        items=notifications, total=total, page=page, page_size=page_size
    )


@router.get("/unread-count", summary="Get unread notification count")
async def unread_count(token: AnyUserToken, db: DBSession):
    user_id = uuid.UUID(token["sub"])
    role = token["role"]
    recipient_type = RecipientType.student if role == "student" else RecipientType.organizer
    count = await get_unread_count(user_id, recipient_type, db)
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=MessageResponse, summary="Mark notification as read")
async def mark_read(notification_id: uuid.UUID, token: AnyUserToken, db: DBSession):
    user_id = uuid.UUID(token["sub"])
    await mark_notification_read(notification_id, user_id, db)
    return MessageResponse(message="Notification marked as read")


@router.put("/read-all", response_model=MessageResponse, summary="Mark all notifications as read")
async def mark_all_as_read(token: AnyUserToken, db: DBSession):
    user_id = uuid.UUID(token["sub"])
    role = token["role"]
    recipient_type = RecipientType.student if role == "student" else RecipientType.organizer
    count = await mark_all_read(user_id, recipient_type, db)
    return MessageResponse(message=f"{count} notifications marked as read")
