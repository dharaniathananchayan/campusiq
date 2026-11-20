"""Tests for authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_registration(client: AsyncClient):
    """Student can register with valid data."""
    resp = await client.post(
        "/api/v1/auth/student/register",
        json={
            "email": "new.student@test.edu",
            "password": "SecurePass1",
            "full_name": "New Student",
            "student_id": "NEW001",
            "department": "Computer Science",
            "year_of_study": 1,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "student"


@pytest.mark.asyncio
async def test_student_registration_with_institute_name_only(client: AsyncClient):
    """Student can register with institute_name without student_id or department."""
    resp = await client.post(
        "/api/v1/auth/student/register",
        json={
            "email": "institute.student@test.edu",
            "password": "SecurePass1",
            "full_name": "Institute Student",
            "institute_name": "Stanford University",
            "year_of_study": 3,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "student"

    # Verify profile contains institute_name
    prof_resp = await client.get(
        "/api/v1/students/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert prof_resp.status_code == 200
    prof_data = prof_resp.json()
    assert prof_data["institute_name"] == "Stanford University"
    assert prof_data["full_name"] == "Institute Student"



@pytest.mark.asyncio
async def test_student_duplicate_email(client: AsyncClient):
    """Duplicate email registration returns 409."""
    payload = {
        "email": "dup@test.edu",
        "password": "SecurePass1",
        "full_name": "Dup Student",
        "student_id": "DUP001",
        "department": "CS",
        "year_of_study": 2,
    }
    await client.post("/api/v1/auth/student/register", json=payload)
    resp = await client.post("/api/v1/auth/student/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_student_login_success(client: AsyncClient, student_token: str):
    """Student login returns valid JWT."""
    resp = await client.post(
        "/api/v1/auth/student/login",
        json={"email": "test.student@campusiq.edu", "password": "TestPass1"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_student_login_wrong_password(client: AsyncClient, student_token: str):
    """Wrong password returns 401."""
    resp = await client.post(
        "/api/v1/auth/student/login",
        json={"email": "test.student@campusiq.edu", "password": "WrongPass1"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_organizer_registration(client: AsyncClient):
    """Organizer can register with valid data."""
    resp = await client.post(
        "/api/v1/auth/organizer/register",
        json={
            "email": "new.org@test.edu",
            "password": "OrgPass1",
            "full_name": "New Organizer",
            "organization_name": "New Club",
            "organization_type": "club",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "organizer"


@pytest.mark.asyncio
async def test_get_student_profile_requires_auth(client: AsyncClient):
    """Unauthenticated access to profile returns 401/403."""
    resp = await client.get("/api/v1/students/me")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_student_profile_authenticated(
    client: AsyncClient, student_token: str
):
    """Authenticated student can access their profile."""
    resp = await client.get(
        "/api/v1/students/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test.student@campusiq.edu"
    assert data["department"] == "Computer Science"


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient):
    """Valid refresh token returns new access token."""
    # Register
    reg_resp = await client.post(
        "/api/v1/auth/student/register",
        json={
            "email": "refresh.test@test.edu",
            "password": "RefreshPass1",
            "full_name": "Refresh Test",
            "student_id": "REFRESH001",
            "department": "CS",
            "year_of_study": 3,
        },
    )
    assert reg_resp.status_code == 201
    refresh_token = reg_resp.json()["refresh_token"]

    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_weak_password_rejected(client: AsyncClient):
    """Password without digit is rejected."""
    resp = await client.post(
        "/api/v1/auth/student/register",
        json={
            "email": "weak@test.edu",
            "password": "nodigitpwd",
            "full_name": "Weak Pass",
            "student_id": "WEAK001",
            "department": "CS",
            "year_of_study": 1,
        },
    )
    assert resp.status_code == 422
