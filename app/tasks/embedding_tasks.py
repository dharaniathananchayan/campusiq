"""Background tasks for embedding generation."""
from __future__ import annotations

import asyncio
import uuid

from app.tasks.celery_app import celery_app


@celery_app.task(name="tasks.generate_event_embedding", bind=True, max_retries=3)
def generate_event_embedding(self, event_id: str) -> dict:
    """Generate and store embedding for an event (run in Celery worker)."""
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.event import Event
        from app.services.ai.gemini_client import get_embedding
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Event).where(Event.id == uuid.UUID(event_id)))
            event = result.scalars().first()
            if not event:
                return {"status": "event_not_found"}

            text = f"{event.title}. {event.description[:500] if event.description else ''}"
            embedding = await get_embedding(text)
            event.embedding = embedding
            await db.commit()
            return {"status": "success", "event_id": event_id}

    return asyncio.run(_run())


@celery_app.task(name="tasks.generate_student_interest_profile", bind=True, max_retries=3)
def generate_student_interest_profile(self, student_id: str) -> dict:
    """Rebuild student interest profile in background."""
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.services.ai.interest_profiler import build_or_update_interest_profile

        async with AsyncSessionLocal() as db:
            profile = await build_or_update_interest_profile(uuid.UUID(student_id), db)
            return {"status": "success", "student_id": student_id}

    return asyncio.run(_run())
