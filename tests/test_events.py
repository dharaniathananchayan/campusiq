"""Tests for event creation, publishing, and discovery."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


def _future_event_payload(offset_days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    start = now + timedelta(days=offset_days)
    end = start + timedelta(hours=3)
    deadline = start - timedelta(days=2)
    return {
        "title": "Test Tech Hackathon 2026",
        "description": "A 24-hour hackathon for innovative tech solutions. Join us for an exciting experience building real-world applications.",
        "short_description": "24-hour hackathon",
        "category_id": None,  # Will be replaced in tests
        "start_datetime": start.isoformat(),
        "end_datetime": end.isoformat(),
        "registration_deadline": deadline.isoformat(),
        "max_capacity": 50,
        "tags": ["hackathon", "coding", "technology"],
        "registration_fee": 0.0,
    }


@pytest.mark.asyncio
async def test_create_event_requires_organizer(client: AsyncClient, student_token: str):
    """Student cannot create events."""
    resp = await client.post(
        "/api/v1/events",
        json=_future_event_payload(),
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient):
    """Categories endpoint returns list."""
    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_category(client: AsyncClient, organizer_token: str):
    """Organizer can create a category."""
    resp = await client.post(
        "/api/v1/categories",
        json={
            "name": "Test Category",
            "slug": "test-category",
            "description": "For testing",
            "color_hex": "#FF5733",
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Category"
    return data["id"]


@pytest.mark.asyncio
async def test_create_and_publish_event(client: AsyncClient, organizer_token: str):
    """Organizer can create a draft event and publish it."""
    # Create category first
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Technical2", "slug": "technical2", "description": "Tech"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    payload = _future_event_payload()
    payload["category_id"] = cat_id

    # Create draft
    create_resp = await client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_data = create_resp.json()
    event_id = event_data["id"]
    assert event_data["status"] == "draft"

    # Publish
    pub_resp = await client.post(
        f"/api/v1/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert pub_resp.status_code == 200
    assert pub_resp.json()["status"] == "published"


@pytest.mark.asyncio
async def test_list_published_events(client: AsyncClient):
    """Public endpoint lists published events."""
    resp = await client.get("/api/v1/events")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data or isinstance(data, list)


@pytest.mark.asyncio
async def test_event_search(client: AsyncClient):
    """Search events by query string."""
    resp = await client.get("/api/v1/events?q=hackathon")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Health endpoint returns healthy status."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_event_date_validation(client: AsyncClient, organizer_token: str):
    """Event with end_datetime before start_datetime is rejected."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "ForValidation", "slug": "for-validation", "description": ""},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Bad Date Event Test Here",
            "description": "This event has invalid dates and should be rejected by the validator.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=3)).isoformat(),  # Before start!
            "registration_deadline": (now + timedelta(days=1)).isoformat(),
            "max_capacity": 50,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_event_with_student_forum_and_messages(
    client: AsyncClient, organizer_token: str, student_token: str
):
    """Event can have a student forum enabled and receive queries/replies."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Forum Category", "slug": "forum-cat"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    create_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Hackathon with Student Forum",
            "description": "A competitive coding hackathon featuring an interactive student Q&A forum.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=10)).isoformat(),
            "end_datetime": (now + timedelta(days=12)).isoformat(),
            "registration_deadline": (now + timedelta(days=8)).isoformat(),
            "max_capacity": 100,
            "has_student_forum": True,
            "status": "published",
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]
    assert create_resp.json()["has_student_forum"] is True
    assert create_resp.json()["status"] == "published"

    # Student posts a query
    msg_resp = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "Are teams assigned randomly or can we bring our own?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert msg_resp.status_code == 201
    msg_data = msg_resp.json()
    assert msg_data["message"] == "Are teams assigned randomly or can we bring our own?"
    assert msg_data["user_role"] == "student"

    # Organizer replies in the forum
    reply_resp = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "You can form teams of up to 4 members before or during kickoff!"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert reply_resp.status_code == 201
    assert reply_resp.json()["user_role"] == "organizer"

    # Anyone can list the forum messages
    list_resp = await client.get(f"/api/v1/events/{event_id}/forum")
    assert list_resp.status_code == 200
    messages = list_resp.json()
    assert len(messages) == 2
    assert messages[0]["message"] == "Are teams assigned randomly or can we bring our own?"
    assert messages[1]["message"] == "You can form teams of up to 4 members before or during kickoff!"


@pytest.mark.asyncio
async def test_archive_event(client: AsyncClient, organizer_token: str):
    """Organizer can archive an event."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Archive Category", "slug": "archive-cat"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    create_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Event to Archive Soon",
            "description": "Testing archive lifecycle transitions and event status updates.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=10)).isoformat(),
            "end_datetime": (now + timedelta(days=11)).isoformat(),
            "registration_deadline": (now + timedelta(days=9)).isoformat(),
            "max_capacity": 50,
            "status": "draft",
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]

    # Archive the event
    arch_resp = await client.post(
        f"/api/v1/events/{event_id}/archive",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert arch_resp.status_code == 200
    assert arch_resp.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_delete_and_republish_event(client: AsyncClient, organizer_token: str):
    """Organizer can update/republish an event and delete it."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Republish Category", "slug": "republish-cat"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    create_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Draft Event to Republish",
            "description": "Initial draft description with sufficient length for validation.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=6)).isoformat(),
            "registration_deadline": (now + timedelta(days=4)).isoformat(),
            "max_capacity": 40,
            "status": "draft",
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "draft"

    # Republish with edits
    update_resp = await client.put(
        f"/api/v1/events/{event_id}",
        json={
            "title": "Republished Event with Edits",
            "status": "published",
            "max_capacity": 60,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Republished Event with Edits"
    assert update_resp.json()["status"] == "published"
    assert update_resp.json()["max_capacity"] == 60

    # Delete the event
    del_resp = await client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert del_resp.status_code == 200

    # Verify event no longer exists
    get_resp = await client.get(f"/api/v1/events/{event_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_event_controls_and_forum_moderation(client: AsyncClient, organizer_token: str, student_token: str):
    """Test registration toggle, forum access modes, member removal, and message deletion."""
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Controls Category", "slug": "controls-cat"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    cat_id = cat_resp.json()["id"]

    now = datetime.now(timezone.utc)
    create_resp = await client.post(
        "/api/v1/events",
        json={
            "title": "Controls & Moderation Summit",
            "description": "Deep dive into access governance and forum moderation.",
            "category_id": cat_id,
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=6)).isoformat(),
            "registration_deadline": (now + timedelta(days=4)).isoformat(),
            "max_capacity": 40,
            "status": "published",
            "has_student_forum": True,
            "forum_access_mode": "open",
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]
    assert create_resp.json()["forum_access_mode"] == "open"
    assert create_resp.json()["is_registration_open"] is True

    # 1. Registration Status Control
    close_reg = await client.post(
        f"/api/v1/events/{event_id}/toggle-registration?is_open=false",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert close_reg.status_code == 200
    assert close_reg.json()["is_registration_open"] is False

    open_reg = await client.post(
        f"/api/v1/events/{event_id}/toggle-registration?is_open=true",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert open_reg.status_code == 200
    assert open_reg.json()["is_registration_open"] is True

    # 2. Student posts initial question in open forum
    post_resp = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "Is remote participation supported for this event?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert post_resp.status_code == 201
    msg_id = post_resp.json()["id"]
    student_user_id = post_resp.json()["user_id"]

    # 3. Forum Members list
    members_resp = await client.get(
        f"/api/v1/events/{event_id}/forum-members",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert members_resp.status_code == 200
    members = members_resp.json()
    assert any(m["user_id"] == student_user_id for m in members)

    # 4. Switch forum access mode to organizer_only
    controls_resp = await client.put(
        f"/api/v1/events/{event_id}/forum-controls",
        json={"has_student_forum": True, "forum_access_mode": "organizer_only"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert controls_resp.status_code == 200
    assert controls_resp.json()["forum_access_mode"] == "organizer_only"

    # Student attempting to post now gets 403 Forbidden
    blocked_post = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "Can I still post here?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert blocked_post.status_code == 403

    # Organizer CAN still post
    org_post = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "Official Organizer Announcement: All sessions will be recorded."},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert org_post.status_code == 201

    # 5. Switch back to open mode, then remove student member
    await client.put(
        f"/api/v1/events/{event_id}/forum-controls",
        json={"has_student_forum": True, "forum_access_mode": "open"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )

    remove_resp = await client.post(
        f"/api/v1/events/{event_id}/forum-members/{student_user_id}/remove",
        json={"reason": "Spamming unrelated links"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert remove_resp.status_code == 200

    # Student now blocked even in open mode
    removed_post = await client.post(
        f"/api/v1/events/{event_id}/forum",
        json={"message": "Trying again after removal"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert removed_post.status_code == 403

    # 6. Delete message
    del_msg_resp = await client.delete(
        f"/api/v1/events/{event_id}/forum-messages/{msg_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert del_msg_resp.status_code == 200

