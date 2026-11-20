"""Tests for registration and feedback."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_register_for_event(client: AsyncClient, student_token: str, organizer_token: str):
    """Student can register for a published event."""
    # Create category
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "RegTestCat", "slug": "reg-test-cat", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    # Create and publish event
    now = datetime.now(timezone.utc)
    event_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Registration Test Event Here",
            "description": "An event for testing registration functionality in the platform.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=10)).isoformat(),
            "end_datetime": (now + timedelta(days=10, hours=2)).isoformat(),
            "registration_deadline": (now + timedelta(days=8)).isoformat(),
            "max_capacity": 30,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert event_resp.status_code == 201
    event_id = event_resp.json()["id"]

    await client.post(
        f"/api/v1/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )

    # Register as student
    reg_resp = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert reg_resp.status_code == 201
    assert reg_resp.json()["status"] == "confirmed"


@pytest.mark.asyncio
async def test_duplicate_registration_rejected(
    client: AsyncClient, student_token: str, organizer_token: str
):
    """Student cannot register for the same event twice."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "DupRegCat", "slug": "dup-reg-cat", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    event_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Duplicate Registration Test Event",
            "description": "Event for testing duplicate registration prevention in the system.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=15)).isoformat(),
            "end_datetime": (now + timedelta(days=15, hours=2)).isoformat(),
            "registration_deadline": (now + timedelta(days=13)).isoformat(),
            "max_capacity": 30,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = event_resp.json()["id"]

    await client.post(
        f"/api/v1/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )

    # First registration
    await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"},
    )

    # Second registration (should fail)
    resp = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_my_registrations(client: AsyncClient, student_token: str):
    """Student can list their registrations."""
    resp = await client.get(
        "/api/v1/students/me/registrations",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_bookmark_event(client: AsyncClient, student_token: str, organizer_token: str):
    """Student can bookmark and unbookmark an event."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "BookmarkCat", "slug": "bookmark-cat", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    event_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Bookmarkable Event Title Here",
            "description": "This is an event that students can bookmark for future reference.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=20)).isoformat(),
            "end_datetime": (now + timedelta(days=20, hours=3)).isoformat(),
            "registration_deadline": (now + timedelta(days=18)).isoformat(),
            "max_capacity": 100,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = event_resp.json()["id"]

    # Bookmark
    bm_resp = await client.post(
        f"/api/v1/events/{event_id}/bookmark",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bm_resp.status_code == 201

    # List bookmarks
    list_resp = await client.get(
        "/api/v1/students/me/bookmarks",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_resp.status_code == 200

    # Remove bookmark
    rm_resp = await client.delete(
        f"/api/v1/events/{event_id}/bookmark",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert rm_resp.status_code == 200
