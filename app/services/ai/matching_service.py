"""AI Event Matching – compute compatibility scores between student and events."""
from __future__ import annotations

import math
import uuid
from typing import List

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventStatus
from app.models.interest_profile import InterestProfile
from app.models.registration import Registration, RegistrationStatus
from app.schemas.ai import EventMatchScore, EventMatchScoreList
from app.services.ai.gemini_client import get_embedding
from app.services.ai.interest_profiler import get_interest_profile
from app.services.event_service import check_event_eligibility
from app.models.student import Student


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def get_event_match_scores(
    student_id: uuid.UUID,
    db: AsyncSession,
    limit: int = 20,
) -> EventMatchScoreList:
    """Get compatibility scores for all published events for a student."""
    # Load student
    student = await db.get(Student, student_id)
    if not student:
        return EventMatchScoreList(items=[], total=0)

    # Load/build interest profile
    profile = await get_interest_profile(student_id, db)

    # Load published events
    events_result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(Event.status == EventStatus.published)
        .limit(200)  # Process at most 200 events
    )
    events = list(events_result.scalars().all())

    # Get already-registered event IDs
    regs_result = await db.execute(
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
    registered_event_ids = {str(row[0]) for row in regs_result.all()}

    scored: List[tuple[float, Event, List[str]]] = []

    for event in events:
        # Skip already registered
        if str(event.id) in registered_event_ids:
            continue

        # Eligibility check
        eligible, _ = await check_event_eligibility(event, student)
        if not eligible:
            continue

        match_reasons: List[str] = []
        raw_score = 0.0

        # 1. Embedding similarity
        if profile and profile.embedding and event.embedding:
            sim = _cosine_similarity(profile.embedding, event.embedding)
            raw_score += sim * 0.5
            if sim > 0.75:
                match_reasons.append("Excellent match with your interest profile")
            elif sim > 0.5:
                match_reasons.append("Good match with your interests")

        # 2. Category preference
        if profile and event.category_id:
            cat_weight = profile.category_weights.get(str(event.category_id), 0.0)
            raw_score += cat_weight * 0.3
            if cat_weight > 0.3:
                match_reasons.append("Matches your preferred event category")

        # 3. Tag overlap
        if profile and event.tags and profile.keyword_interests:
            overlap = sum(
                profile.keyword_interests.get(tag.lower(), 0.0)
                for tag in event.tags
            )
            normalized = min(1.0, overlap / max(1, len(event.tags)))
            raw_score += normalized * 0.2
            if normalized > 0.4:
                matching_tags = [t for t in event.tags if profile.keyword_interests.get(t.lower(), 0) > 0]
                match_reasons.append(f"Matches your interests: {', '.join(matching_tags[:3])}")

        # Convert to 0–100 scale
        compatibility_score = min(100.0, raw_score * 100)

        if not match_reasons:
            match_reasons.append("General interest match")

        scored.append((compatibility_score, event, match_reasons))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    items = [
        EventMatchScore(
            event=event,
            compatibility_score=round(score, 1),
            match_reasons=reasons,
        )
        for score, event, reasons in top
    ]

    return EventMatchScoreList(items=items, total=len(scored))


async def get_single_event_match_score(
    student_id: uuid.UUID,
    event_id: uuid.UUID,
    db: AsyncSession,
) -> EventMatchScore:
    """Get compatibility score for a single event."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(Event.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Event", str(event_id))

    # Get all scores and filter for this event
    all_scores = await get_event_match_scores(student_id, db, limit=1000)
    for item in all_scores.items:
        if str(item.event.id) == str(event_id):
            return item

    # Not in scored list (already registered or ineligible)
    return EventMatchScore(
        event=event,
        compatibility_score=0.0,
        match_reasons=["Not available for scoring"],
    )
