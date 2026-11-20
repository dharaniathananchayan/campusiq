"""AI Student Targeting – find students most likely interested in an event."""
from __future__ import annotations

import math
import uuid
from typing import List

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.event import Event, EventStatus
from app.models.interest_profile import InterestProfile
from app.models.registration import Registration, RegistrationStatus
from app.models.student import Student
from app.schemas.ai import TargetedStudent, TargetingResponse
from app.services.ai.gemini_client import get_embedding
from app.core.exceptions import NotFoundError

settings = get_settings()


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def get_targeted_students(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
    top_n: int | None = None,
) -> TargetingResponse:
    """Return the top-N students most likely interested in the event."""
    top_n = top_n or settings.AI_TARGETING_TOP_N

    # Verify event and ownership
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))
    if str(event.organizer_id) != str(organizer_id):
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("You do not own this event")

    # Build event text for embedding
    event_text = (
        f"Event: {event.title}. "
        f"Description: {event.description[:300] if event.description else ''}. "
        f"Tags: {', '.join(event.tags or [])}."
    )

    # Get event embedding (use stored or compute)
    if event.embedding:
        event_embedding = event.embedding
    else:
        try:
            event_embedding = await get_embedding(event_text)
        except Exception:
            event_embedding = None

    # Load all active students with interest profiles
    profiles_result = await db.execute(
        select(InterestProfile, Student)
        .join(Student, Student.id == InterestProfile.student_id)
        .where(Student.is_active == True)
    )
    profile_rows = profiles_result.all()

    total_analyzed = len(profile_rows)
    scored_students: List[tuple[float, Student, List[str]]] = []

    # Get students already registered/invited
    already_registered_result = await db.execute(
        select(Registration.student_id).where(
            and_(
                Registration.event_id == event_id,
                Registration.status.in_([
                    RegistrationStatus.confirmed,
                    RegistrationStatus.waitlisted,
                    RegistrationStatus.attended,
                ]),
            )
        )
    )
    already_registered = {str(row[0]) for row in already_registered_result.all()}

    for profile, student in profile_rows:
        # Skip already registered students
        if str(student.id) in already_registered:
            continue

        match_reasons: List[str] = []
        score = 0.0

        # 1. Vector similarity (embedding-based)
        if event_embedding and profile.embedding:
            sim = _cosine_similarity(event_embedding, profile.embedding)
            score += sim * 0.6  # 60% weight
            if sim > 0.7:
                match_reasons.append("Strong interest alignment based on profile")

        # 2. Category weight
        if event.category_id:
            cat_weight = profile.category_weights.get(str(event.category_id), 0.0)
            score += cat_weight * 0.25  # 25% weight
            if cat_weight > 0.2:
                match_reasons.append(f"High interest in this event category")

        # 3. Tag keyword overlap
        if event.tags and profile.keyword_interests:
            overlap = sum(
                profile.keyword_interests.get(tag.lower(), 0.0)
                for tag in event.tags
            )
            normalized_overlap = min(1.0, overlap / max(1, len(event.tags)))
            score += normalized_overlap * 0.15  # 15% weight
            if normalized_overlap > 0.3:
                match_reasons.append(f"Interest in event keywords: {', '.join(event.tags[:3])}")

        # Eligibility pre-filter
        criteria = event.eligibility_criteria or {}
        departments = criteria.get("departments", [])
        years = criteria.get("year_of_study", [])
        if departments and student.department not in departments:
            continue
        if years and student.year_of_study not in years:
            continue

        if not match_reasons:
            match_reasons.append("General campus event interest")

        scored_students.append((score, student, match_reasons))

    # Sort by score, return top N
    scored_students.sort(key=lambda x: x[0], reverse=True)
    top_students = scored_students[:top_n]

    return TargetingResponse(
        event_id=event_id,
        total_analyzed=total_analyzed,
        recommended_students=[
            TargetedStudent(
                student=student,
                match_score=round(score, 4),
                match_reasons=reasons,
            )
            for score, student, reasons in top_students
        ],
    )
