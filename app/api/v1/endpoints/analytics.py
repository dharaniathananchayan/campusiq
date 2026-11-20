"""Analytics endpoints (Milestone 3)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.core.dependencies import DBSession, OrganizerToken
from app.schemas.analytics import EventAnalytics, OrganizerAnalytics
from app.services.analytics_service import get_event_analytics, get_organizer_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/events/{event_id}",
    response_model=EventAnalytics,
    summary="Full event analytics with benchmarking (organizer)",
)
async def event_analytics(event_id: uuid.UUID, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    return await get_event_analytics(event_id, organizer_id, db)


@router.get(
    "/organizer/me",
    response_model=OrganizerAnalytics,
    summary="Organizer cross-event analytics",
)
async def organizer_analytics(token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    return await get_organizer_analytics(organizer_id, db)
