"""Tests for Event Insights: Registration controls and Event Announcement Board."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


def _event_payload(cat_id: str, offset_days: int = 20) -> dict:
    now = datetime.now(timezone.utc)
    start = now + timedelta(days=offset_days)
    end = start + timedelta(hours=3)
    deadline = start - timedelta(days=2)
    return {
        "title": "Robotics & Drone Showcase 2026",
        "description": "Annual campus robotics exhibition with drone navigation obstacles and sensor challenges.",
        "short_description": "Robotics exhibition & challenge",
        "category_id": cat_id,
        "start_datetime": start.isoformat(),
        "end_datetime": end.isoformat(),
        "registration_deadline": deadline.isoformat(),
        "max_capacity": 50,
        "tags": ["robotics", "drones", "engineering"],
        "registration_fee": 0.0,
    }


@pytest.mark.asyncio
async def test_event_insights_registration_toggle_and_announcements(
    client: AsyncClient, organizer_token: str, student_token: str
):
    # 1. Setup category & event
    cat_resp = await client.post(
        "/api/v1/categories",
        json={"name": "Insights Category", "slug": "insights-cat", "description": "For insights testing"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    # Create event
    create_resp = await client.post(
        "/api/v1/events",
        json=_event_payload(cat_id),
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert create_resp.status_code == 201
    event_id = create_resp.json()["id"]

    # Publish event
    pub_resp = await client.post(
        f"/api/v1/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert pub_resp.status_code == 200
    assert pub_resp.json()["is_registration_open"] is True

    # 2. Toggle registration to closed
    toggle_resp = await client.post(
        f"/api/v1/events/{event_id}/toggle-registration",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_registration_open"] is False

    # 3. Student tries to register while closed -> should fail with 400
    reg_fail_resp = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert reg_fail_resp.status_code == 400
    err_body = reg_fail_resp.json()
    err_msg = err_body.get("message") or err_body.get("detail") or ""
    assert "closed" in err_msg.lower()

    # 4. Reopen registrations
    reopen_resp = await client.post(
        f"/api/v1/events/{event_id}/toggle-registration?is_open=true",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert reopen_resp.status_code == 200
    assert reopen_resp.json()["is_registration_open"] is True

    # 5. Student now registers successfully
    reg_success = await client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert reg_success.status_code == 201

    # 6. Post an announcement to the Event Announcement Board
    ann_resp = await client.post(
        f"/api/v1/events/{event_id}/announcements",
        json={
            "title": "Room Update: Hall B",
            "content": "Please note that the showcase has been moved to Hall B on the ground floor.",
            "priority": "urgent",
            "is_pinned": True,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert ann_resp.status_code == 201
    ann_data = ann_resp.json()
    assert ann_data["title"] == "Room Update: Hall B"
    assert ann_data["priority"] == "urgent"
    assert ann_data["is_pinned"] is True
    ann_id = ann_data["id"]

    # 7. List announcements for this event
    list_ann = await client.get(f"/api/v1/events/{event_id}/announcements")
    assert list_ann.status_code == 200
    anns = list_ann.json()
    assert len(anns) == 1
    assert anns[0]["id"] == ann_id

    # 8. Registered student views announcement board via /students/me/announcements
    student_ann_resp = await client.get(
        "/api/v1/students/me/announcements",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert student_ann_resp.status_code == 200
    student_anns = student_ann_resp.json()
    assert len(student_anns) >= 1
    matching = [a for a in student_anns if a["id"] == ann_id]
    assert len(matching) == 1
    assert matching[0]["event_title"] == "Robotics & Drone Showcase 2026"
    assert matching[0]["priority"] == "urgent"

    # 9. Delete announcement
    del_resp = await client.delete(
        f"/api/v1/events/{event_id}/announcements/{ann_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert del_resp.status_code == 200

    # Verify announcement was deleted
    list_ann_after = await client.get(f"/api/v1/events/{event_id}/announcements")
    assert len(list_ann_after.json()) == 0
