"""AI Interest Profiler – builds and updates student interest profiles."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark
from app.models.category import Category
from app.models.event import Event
from app.models.feedback import Feedback
from app.models.interest_profile import InterestProfile
from app.models.registration import Registration, RegistrationStatus
from app.services.ai.gemini_client import get_embedding

# Interaction weights for interest score computation
_WEIGHTS = {
    "registration": 3.0,
    "attended": 5.0,
    "bookmark": 2.0,
    "feedback_positive": 2.0,
    "feedback_negative": -1.0,
}


async def build_or_update_interest_profile(
    student_id: uuid.UUID, db: AsyncSession
) -> InterestProfile:
    """Rebuild the AI interest profile for a student from scratch."""

    # Gather all registrations
    reg_result = await db.execute(
        select(Registration, Event)
        .join(Event, Event.id == Registration.event_id)
        .where(Registration.student_id == student_id)
    )
    reg_rows = reg_result.all()

    # Gather all bookmarks
    bm_result = await db.execute(
        select(Bookmark, Event)
        .join(Event, Event.id == Bookmark.event_id)
        .where(Bookmark.student_id == student_id)
    )
    bm_rows = bm_result.all()

    # Gather all feedback
    fb_result = await db.execute(
        select(Feedback, Event)
        .join(Event, Event.id == Feedback.event_id)
        .where(Feedback.student_id == student_id)
    )
    fb_rows = fb_result.all()

    # ── Compute category weights ──────────────────────────────────────────────
    category_scores: Dict[str, float] = {}

    for reg, event in reg_rows:
        cat_id = str(event.category_id) if event.category_id else "unknown"
        weight = _WEIGHTS["attended"] if reg.status == RegistrationStatus.attended else _WEIGHTS["registration"]
        category_scores[cat_id] = category_scores.get(cat_id, 0.0) + weight

    for bm, event in bm_rows:
        cat_id = str(event.category_id) if event.category_id else "unknown"
        category_scores[cat_id] = category_scores.get(cat_id, 0.0) + _WEIGHTS["bookmark"]

    for fb, event in fb_rows:
        cat_id = str(event.category_id) if event.category_id else "unknown"
        weight = _WEIGHTS["feedback_positive"] if fb.rating >= 4 else _WEIGHTS["feedback_negative"]
        category_scores[cat_id] = category_scores.get(cat_id, 0.0) + weight

    # Normalize to [0, 1]
    total_score = sum(category_scores.values())
    if total_score > 0:
        category_weights = {k: round(v / total_score, 4) for k, v in category_scores.items()}
    else:
        category_weights = {}

    # ── Keyword interests ─────────────────────────────────────────────────────
    keyword_scores: Dict[str, float] = {}
    for reg, event in reg_rows:
        for tag in (event.tags or []):
            keyword_scores[tag.lower()] = keyword_scores.get(tag.lower(), 0.0) + 1.0
    for bm, event in bm_rows:
        for tag in (event.tags or []):
            keyword_scores[tag.lower()] = keyword_scores.get(tag.lower(), 0.0) + 0.5

    # Top 20 keywords
    keyword_interests = dict(
        sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)[:20]
    )

    # ── Engagement score ──────────────────────────────────────────────────────
    engagement_score = min(
        100.0,
        len(reg_rows) * 10 + len(bm_rows) * 5 + len(fb_rows) * 8,
    )

    # ── Build embedding from interest summary text ────────────────────────────
    # Load category names for embedding
    cat_ids = list(category_scores.keys())
    if cat_ids:
        cats_result = await db.execute(
            select(Category).where(Category.id.in_([uuid.UUID(cid) for cid in cat_ids if cid != "unknown"]))
        )
        cats = {str(c.id): c.name for c in cats_result.scalars().all()}
    else:
        cats = {}

    interest_text = (
        f"Student interests: categories: {', '.join(cats.get(k, k) for k in list(category_scores.keys())[:5])}. "
        f"Keywords: {', '.join(list(keyword_interests.keys())[:10])}."
    )
    try:
        embedding = await get_embedding(interest_text)
    except Exception:
        embedding = None

    # ── Upsert interest profile ───────────────────────────────────────────────
    existing_result = await db.execute(
        select(InterestProfile).where(InterestProfile.student_id == student_id)
    )
    profile = existing_result.scalars().first()

    if profile:
        profile.category_weights = category_weights
        profile.keyword_interests = keyword_interests
        profile.engagement_score = engagement_score
        profile.total_registrations = len(reg_rows)
        profile.total_bookmarks = len(bm_rows)
        profile.total_feedback = len(fb_rows)
        profile.last_updated = datetime.now(timezone.utc)
        if embedding:
            profile.embedding = embedding
    else:
        profile = InterestProfile(
            student_id=student_id,
            category_weights=category_weights,
            keyword_interests=keyword_interests,
            engagement_score=engagement_score,
            total_registrations=len(reg_rows),
            total_bookmarks=len(bm_rows),
            total_feedback=len(fb_rows),
            last_updated=datetime.now(timezone.utc),
            embedding=embedding,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


async def get_interest_profile(
    student_id: uuid.UUID, db: AsyncSession
) -> InterestProfile | None:
    """Fetch or auto-create an interest profile for the student."""
    result = await db.execute(
        select(InterestProfile).where(InterestProfile.student_id == student_id)
    )
    profile = result.scalars().first()
    if not profile:
        profile = await build_or_update_interest_profile(student_id, db)
    return profile
