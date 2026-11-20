"""Feedback endpoints."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Query, status

from app.core.dependencies import DBSession, OrganizerToken, StudentToken
from app.schemas.common import MessageResponse
from app.schemas.registration import FeedbackCreate, FeedbackResponse, FeedbackSummary
from app.services.feedback_service import (
    get_event_feedback,
    get_feedback_summary,
    submit_feedback,
)

router = APIRouter(tags=["Feedback"])


@router.post(
    "/events/{event_id}/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback for an event (student)",
)
async def submit_event_feedback(
    event_id: uuid.UUID, data: FeedbackCreate, token: StudentToken, db: DBSession
):
    student_id = uuid.UUID(token["sub"])
    return await submit_feedback(student_id, event_id, data, db)


@router.get(
    "/events/{event_id}/feedback",
    response_model=list[FeedbackResponse],
    summary="List event feedback",
)
async def list_feedback(
    event_id: uuid.UUID,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return await get_event_feedback(event_id, db, page=page, page_size=page_size)


@router.get(
    "/events/{event_id}/feedback/summary",
    response_model=FeedbackSummary,
    summary="Get aggregated feedback summary for an event",
)
async def feedback_summary(event_id: uuid.UUID, db: DBSession):
    return await get_feedback_summary(event_id, db)
