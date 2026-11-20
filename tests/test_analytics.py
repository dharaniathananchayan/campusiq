"""Tests for analytics endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_live_analytics_requires_organizer(client: AsyncClient, student_token: str):
    """Students cannot access live analytics."""
    import uuid
    resp = await client.get(
        f"/api/v1/events/{uuid.uuid4()}/analytics/live",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_live_analytics_for_own_event(
    client: AsyncClient, organizer_token: str
):
    """Organizer can get live analytics for their event."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "AnalyticsCat", "slug": "analytics-cat", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    event_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Analytics Test Event Full Title",
            "description": "This event is used to test the live analytics dashboard functionality.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=5, hours=2)).isoformat(),
            "registration_deadline": (now + timedelta(days=3)).isoformat(),
            "max_capacity": 100,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert event_resp.status_code == 201
    event_id = event_resp.json()["id"]

    await client.post(
        f"/api/v1/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )

    analytics_resp = await client.get(
        f"/api/v1/events/{event_id}/analytics/live",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "current_registrations" in data
    assert "capacity_utilization" in data
    assert "hourly_trend" in data
    assert data["max_capacity"] == 100


@pytest.mark.asyncio
async def test_organizer_analytics(client: AsyncClient, organizer_token: str):
    """Organizer analytics endpoint returns stats."""
    resp = await client.get(
        "/api/v1/analytics/organizer/me",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_events" in data
    assert "avg_rating" in data


@pytest.mark.asyncio
async def test_student_dashboard(client: AsyncClient, student_token: str):
    """Student dashboard endpoint returns dashboard data."""
    resp = await client.get(
        "/api/v1/students/me/dashboard",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "upcoming_events" in data
    assert "recommended_events" in data
    assert "stats" in data
