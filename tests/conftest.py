"""Pytest configuration and shared fixtures."""
from __future__ import annotations

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.dependencies import get_db
from app.db.base import Base
from app.main import app

# Use SQLite in-memory for tests (fast, no PostgreSQL needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Reusable data factories ───────────────────────────────────────────────────

STUDENT_DATA = {
    "email": "test.student@campusiq.edu",
    "password": "TestPass1",
    "full_name": "Test Student",
    "student_id": "STU001",
    "department": "Computer Science",
    "year_of_study": 2,
}

ORGANIZER_DATA = {
    "email": "test.organizer@campusiq.edu",
    "password": "OrgPass1",
    "full_name": "Test Organizer",
    "organization_name": "Tech Club",
    "organization_type": "club",
}


@pytest_asyncio.fixture
async def student_token(client: AsyncClient) -> str:
    """Register a student and return their access token."""
    resp = await client.post("/api/v1/auth/student/register", json=STUDENT_DATA)
    if resp.status_code == 409:
        resp = await client.post(
            "/api/v1/auth/student/login",
            json={"email": STUDENT_DATA["email"], "password": STUDENT_DATA["password"]},
        )
    assert resp.status_code in (200, 201)
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def organizer_token(client: AsyncClient) -> str:
    """Register an organizer and return their access token."""
    resp = await client.post("/api/v1/auth/organizer/register", json=ORGANIZER_DATA)
    if resp.status_code == 409:
        resp = await client.post(
            "/api/v1/auth/organizer/login",
            json={"email": ORGANIZER_DATA["email"], "password": ORGANIZER_DATA["password"]},
        )
    assert resp.status_code in (200, 201)
    return resp.json()["access_token"]
