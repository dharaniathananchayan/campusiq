"""Tests for AI feedback analysis service (mocked Groq calls)."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_feedback_analysis_endpoint_no_feedback(
    client: AsyncClient, organizer_token: str
):
    """Feedback analysis returns 422 when no feedback exists for event."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "AITestCat", "slug": "ai-test-cat", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    event_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "AI Feedback Analysis Test Event",
            "description": "An event specifically created to test the AI feedback analysis endpoint.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=5, hours=3)).isoformat(),
            "registration_deadline": (now + timedelta(days=3)).isoformat(),
            "max_capacity": 50,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert event_resp.status_code == 201
    event_id = event_resp.json()["id"]

    # Try to analyze with no feedback — expect 422 (ValidationError)
    resp = await client.post(
        f"/api/v1/ai/events/{event_id}/feedback-analysis",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert resp.status_code in (400, 422)


@pytest.mark.asyncio
async def test_interest_profile_endpoint(client: AsyncClient, student_token: str):
    """Student can fetch their interest profile (auto-created if missing)."""
    resp = await client.get(
        "/api/v1/ai/interest-profile",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "category_weights" in data
    assert "engagement_score" in data


@pytest.mark.asyncio
async def test_event_match_scores(client: AsyncClient, student_token: str):
    """Student can get AI match scores for events."""
    resp = await client.get(
        "/api/v1/ai/events/match-scores",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_targeting_requires_organizer(client: AsyncClient, student_token: str):
    """Students cannot access targeting endpoint."""
    fake_event_id = str(uuid.uuid4())
    resp = await client.get(
        f"/api/v1/ai/events/{fake_event_id}/targeting",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_rag_assistant_requires_auth(client: AsyncClient):
    """RAG assistant requires authentication."""
    resp = await client.post(
        "/api/v1/ai/assistant/chat",
        json={"message": "What events are happening this week?"},
    )
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_copilot_requires_organizer(client: AsyncClient, student_token: str):
    """Co-Pilot is organizer-only."""
    resp = await client.post(
        "/api/v1/ai/copilot/sessions",
        json={"initial_message": "Help me plan a hackathon"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403
