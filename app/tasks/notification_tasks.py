"""Background notification tasks."""
from __future__ import annotations

import asyncio
import uuid

from app.tasks.celery_app import celery_app


@celery_app.task(name="tasks.send_registration_confirmation")
def send_registration_confirmation(student_id: str, event_id: str) -> dict:
    """Send registration confirmation notification."""
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.event import Event
        from app.models.notification import RecipientType, NotificationType
        from app.services.feedback_service import create_notification
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            event = await db.get(Event, uuid.UUID(event_id))
            if not event:
                return {"status": "event_not_found"}
            await create_notification(
                recipient_id=uuid.UUID(student_id),
                recipient_type=RecipientType.student,
                notif_type=NotificationType.confirmation,
                title=f"Registration Confirmed: {event.title}",
                message=f"You are registered for '{event.title}' on {event.start_datetime.strftime('%B %d, %Y')}.",
                db=db,
                metadata={"event_id": event_id},
            )
            return {"status": "sent"}

    return asyncio.run(_run())


@celery_app.task(name="tasks.send_event_reminder")
def send_event_reminder(event_id: str) -> dict:
    """Send reminder notifications to all registered students for an event."""
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.event import Event
        from app.models.registration import Registration, RegistrationStatus
        from app.models.notification import RecipientType, NotificationType
        from app.services.feedback_service import create_notification
        from sqlalchemy import and_, select

        async with AsyncSessionLocal() as db:
            event = await db.get(Event, uuid.UUID(event_id))
            if not event:
                return {"status": "event_not_found"}

            regs_result = await db.execute(
                select(Registration).where(
                    and_(
                        Registration.event_id == uuid.UUID(event_id),
                        Registration.status == RegistrationStatus.confirmed,
                    )
                )
            )
            registrations = list(regs_result.scalars().all())
            count = 0
            for reg in registrations:
                await create_notification(
                    recipient_id=reg.student_id,
                    recipient_type=RecipientType.student,
                    notif_type=NotificationType.reminder,
                    title=f"Reminder: {event.title} is tomorrow!",
                    message=f"Don't forget! '{event.title}' starts on {event.start_datetime.strftime('%B %d at %I:%M %p')}.",
                    db=db,
                    metadata={"event_id": event_id},
                )
                count += 1
            return {"status": "sent", "count": count}

    return asyncio.run(_run())
