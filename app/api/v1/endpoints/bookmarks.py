"""Bookmark endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.core.dependencies import DBSession, StudentToken
from app.schemas.common import MessageResponse
from app.schemas.registration import BookmarkResponse
from app.services.feedback_service import (
    add_bookmark,
    get_student_bookmarks,
    remove_bookmark,
)

router = APIRouter(tags=["Bookmarks"])


@router.post(
    "/events/{event_id}/bookmark",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bookmark an event",
)
async def bookmark_event(event_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    await add_bookmark(student_id, event_id, db)
    return MessageResponse(message="Event bookmarked")


@router.delete(
    "/events/{event_id}/bookmark",
    response_model=MessageResponse,
    summary="Remove event bookmark",
)
async def remove_event_bookmark(event_id: uuid.UUID, token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    await remove_bookmark(student_id, event_id, db)
    return MessageResponse(message="Bookmark removed")


@router.get(
    "/students/me/bookmarks",
    response_model=list[BookmarkResponse],
    summary="Get my bookmarked events",
)
async def my_bookmarks(
    token: StudentToken,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    student_id = uuid.UUID(token["sub"])
    return await get_student_bookmarks(student_id, db, page=page, page_size=page_size)
