"""AI endpoints – Interest Profile, Targeting, Event Matching, Feedback Analysis."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, status

from app.core.dependencies import DBSession, OrganizerToken, StudentToken
from app.models.invitation import Invitation, InvitationStatus
from app.schemas.ai import (
    EventMatchScore,
    EventMatchScoreList,
    FeedbackAnalysisResponse,
    InterestProfileResponse,
    InvitationCreate,
    InvitationResponse,
    TargetingResponse,
)
from app.schemas.common import MessageResponse
from app.services.ai.interest_profiler import (
    build_or_update_interest_profile,
    get_interest_profile,
)
from app.services.ai.targeting_service import get_targeted_students
from app.services.ai.matching_service import get_event_match_scores, get_single_event_match_score
from app.services.ai.feedback_analyzer import analyze_event_feedback, get_feedback_analysis
from datetime import datetime, timezone

router = APIRouter(prefix="/ai", tags=["AI Features"])


# ── Interest Profile (Student) ────────────────────────────────────────────────

@router.get(
    "/interest-profile",
    response_model=InterestProfileResponse,
    summary="[Student] Get AI interest profile",
)
async def get_my_interest_profile(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    profile = await get_interest_profile(student_id, db)
    return profile


@router.post(
    "/interest-profile/refresh",
    response_model=InterestProfileResponse,
    summary="[Student] Rebuild AI interest profile from activity data",
)
async def refresh_interest_profile(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await build_or_update_interest_profile(student_id, db)


# ── Event Matching (Student) ──────────────────────────────────────────────────

@router.get(
    "/events/match-scores",
    response_model=EventMatchScoreList,
    summary="[Student] Get AI compatibility scores for all available events",
)
async def event_match_scores(token: StudentToken, db: DBSession):
    student_id = uuid.UUID(token["sub"])
    return await get_event_match_scores(student_id, db)


@router.get(
    "/events/{event_id}/match-score",
    response_model=EventMatchScore,
    summary="[Student] Get AI compatibility score for a specific event",
)
async def single_event_match_score(
    event_id: uuid.UUID, token: StudentToken, db: DBSession
):
    student_id = uuid.UUID(token["sub"])
    return await get_single_event_match_score(student_id, event_id, db)


# ── AI Targeting (Organizer) ──────────────────────────────────────────────────

@router.get(
    "/events/{event_id}/targeting",
    response_model=TargetingResponse,
    summary="[Organizer] Get AI-recommended students for event targeting",
)
async def targeting_recommendations(
    event_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    return await get_targeted_students(event_id, organizer_id, db)


@router.post(
    "/events/{event_id}/invitations",
    response_model=List[InvitationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="[Organizer] Send personalized invitations to targeted students",
)
async def send_invitations(
    event_id: uuid.UUID,
    data: InvitationCreate,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    now = datetime.now(timezone.utc)
    invitations = []
    for student_id in data.student_ids:
        inv = Invitation(
            event_id=event_id,
            student_id=student_id,
            organizer_id=organizer_id,
            status=InvitationStatus.pending,
            personalized_message=data.personalized_message,
            sent_at=now,
        )
        db.add(inv)
        invitations.append(inv)
    await db.commit()
    for inv in invitations:
        await db.refresh(inv)
    return invitations


# ── AI Feedback Analysis (Organizer) ─────────────────────────────────────────

@router.post(
    "/events/{event_id}/feedback-analysis",
    response_model=FeedbackAnalysisResponse,
    summary="[Organizer] Run Groq AI sentiment analysis on event feedback",
)
async def run_feedback_analysis(
    event_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    return await analyze_event_feedback(event_id, organizer_id, db)


@router.get(
    "/events/{event_id}/feedback-analysis",
    response_model=FeedbackAnalysisResponse,
    summary="[Organizer] Get existing AI feedback analysis results",
)
async def get_feedback_analysis_result(
    event_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    from app.core.exceptions import NotFoundError
    analysis = await get_feedback_analysis(event_id, db)
    if not analysis:
        raise NotFoundError("Feedback analysis", "Run analysis first via POST endpoint")
    return analysis
