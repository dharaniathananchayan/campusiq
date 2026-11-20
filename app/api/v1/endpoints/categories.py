"""Category and Venue endpoints."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, status
from sqlalchemy import select

from app.core.dependencies import DBSession, OrganizerToken
from app.core.exceptions import NotFoundError
from app.models.category import Category
from app.models.venue import Venue
from app.schemas.venue import (
    CategoryCreate,
    CategoryResponse,
    VenueCreate,
    VenueResponse,
    VenueUpdate,
)

categories_router = APIRouter(prefix="/categories", tags=["Categories & Venues"])
venues_router = APIRouter(prefix="/venues", tags=["Categories & Venues"])


# ── Categories ────────────────────────────────────────────────────────────────

@categories_router.get("", response_model=List[CategoryResponse], summary="List all categories")
async def list_categories(db: DBSession):
    result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.name)
    )
    return list(result.scalars().all())


@categories_router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (organizer)",
)
async def create_category(data: CategoryCreate, token: OrganizerToken, db: DBSession):
    cat = Category(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@categories_router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: uuid.UUID, db: DBSession):
    cat = await db.get(Category, category_id)
    if not cat:
        raise NotFoundError("Category")
    return cat


# ── Venues ────────────────────────────────────────────────────────────────────

@venues_router.get("", response_model=List[VenueResponse], summary="List all venues")
async def list_venues(db: DBSession):
    result = await db.execute(
        select(Venue).where(Venue.is_available == True).order_by(Venue.name)
    )
    return list(result.scalars().all())


@venues_router.post(
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new venue (organizer)",
)
async def create_venue(data: VenueCreate, token: OrganizerToken, db: DBSession):
    venue = Venue(**data.model_dump())
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    return venue


@venues_router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: uuid.UUID, db: DBSession):
    venue = await db.get(Venue, venue_id)
    if not venue:
        raise NotFoundError("Venue")
    return venue


@venues_router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: uuid.UUID, data: VenueUpdate, token: OrganizerToken, db: DBSession
):
    venue = await db.get(Venue, venue_id)
    if not venue:
        raise NotFoundError("Venue")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(venue, field, value)
    await db.commit()
    await db.refresh(venue)
    return venue
