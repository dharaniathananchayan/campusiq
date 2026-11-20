"""Organizer profile endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import DBSession, OrganizerToken
from app.core.exceptions import NotFoundError
from app.models.organizer import Organizer
from app.schemas.common import MessageResponse
from app.schemas.organizer import OrganizerPublicResponse, OrganizerResponse, OrganizerUpdate

router = APIRouter(prefix="/organizers", tags=["Organizers"])


async def _get_organizer(organizer_id: uuid.UUID, db) -> Organizer:
    org = await db.get(Organizer, organizer_id)
    if not org or not org.is_active:
        raise NotFoundError("Organizer")
    return org


@router.get("/me", response_model=OrganizerResponse, summary="Get my organizer profile")
async def get_my_profile(token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    return await _get_organizer(organizer_id, db)


@router.put("/me", response_model=OrganizerResponse, summary="Update my organizer profile")
async def update_my_profile(data: OrganizerUpdate, token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    org = await _get_organizer(organizer_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(org, field, value)
    await db.commit()
    await db.refresh(org)
    return org


@router.delete("/me", response_model=MessageResponse, summary="Deactivate organizer account")
async def deactivate_account(token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    org = await _get_organizer(organizer_id, db)
    org.is_active = False
    await db.commit()
    return MessageResponse(message="Your organizer account has been deactivated")


@router.get(
    "/{organizer_id}",
    response_model=OrganizerPublicResponse,
    summary="Get public organizer profile",
)
async def get_organizer_public(organizer_id: uuid.UUID, db: DBSession):
    return await _get_organizer(organizer_id, db)
