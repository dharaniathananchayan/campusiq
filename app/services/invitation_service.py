"""Invitation service – manage student invitations, acceptance and decline."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.event import Event
from app.models.invitation import Invitation, InvitationStatus
from app.models.organizer import Organizer
from app.models.registration import Registration, RegistrationStatus
from app.services.registration_service import register_for_event


async def get_student_invitations(
    student_id: uuid.UUID, db: AsyncSession
) -> List[dict]:
    """Get all event invitations addressed to the student with rich metadata."""
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.event).options(
                selectinload(Event.category),
                selectinload(Event.venue),
            ),
            selectinload(Invitation.organizer),
        )
        .where(Invitation.student_id == student_id)
        .order_by(desc(Invitation.sent_at))
    )
    invitations = list(result.scalars().all())

    # Check which events the student is already registered for
    event_ids = [inv.event_id for inv in invitations if inv.event_id]
    registered_event_ids = set()
    if event_ids:
        reg_result = await db.execute(
            select(Registration.event_id).where(
                and_(
                    Registration.student_id == student_id,
                    Registration.event_id.in_(event_ids),
                    Registration.status.in_([
                        RegistrationStatus.confirmed,
                        RegistrationStatus.waitlisted,
                        RegistrationStatus.attended,
                    ]),
                )
            )
        )
        registered_event_ids = set(reg_result.scalars().all())

    items = []
    for inv in invitations:
        event = inv.event
        organizer = inv.organizer

        status_str = inv.status.value if hasattr(inv.status, "value") else str(inv.status)

        items.append({
            "id": inv.id,
            "event_id": inv.event_id,
            "organizer_id": inv.organizer_id,
            "status": status_str,
            "personalized_message": inv.personalized_message,
            "ai_match_score": inv.ai_match_score,
            "sent_at": inv.sent_at,
            "responded_at": inv.responded_at,
            "event_title": event.title if event else "Campus Event",
            "event_short_description": event.short_description if event else None,
            "event_description": event.description if event else None,
            "category_name": event.category.name if (event and event.category) else "Campus Event",
            "venue_name": event.venue.name if (event and event.venue) else "Campus Venue",
            "start_datetime": event.start_datetime if event else None,
            "end_datetime": event.end_datetime if event else None,
            "organizer_name": organizer.full_name if organizer else "Campus Organizer",
            "organization_name": organizer.organization_name if organizer else "Campus Committee",
            "is_registered": inv.event_id in registered_event_ids,
        })
    return items


async def accept_student_invitation(
    invitation_id: uuid.UUID, student_id: uuid.UUID, db: AsyncSession
) -> dict:
    """Accept an invitation, attempt auto-registration, and return event info for navigation."""
    invitation = await db.get(Invitation, invitation_id)
    if not invitation or invitation.student_id != student_id:
        raise NotFoundError("Invitation", str(invitation_id))

    invitation.status = InvitationStatus.accepted
    invitation.responded_at = datetime.now(timezone.utc)

    # Attempt to auto-register student for the event if possible
    try:
        await register_for_event(student_id, invitation.event_id, db)
    except Exception:
        # If registration fails (e.g. deadline or capacity or already registered),
        # still allow acceptance and redirection to event page
        pass

    await db.commit()
    await db.refresh(invitation)

    return {
        "message": "Invitation accepted successfully",
        "invitation_id": invitation.id,
        "event_id": invitation.event_id,
        "status": "accepted",
    }


async def decline_student_invitation(
    invitation_id: uuid.UUID, student_id: uuid.UUID, db: AsyncSession
) -> dict:
    """Decline an invitation."""
    invitation = await db.get(Invitation, invitation_id)
    if not invitation or invitation.student_id != student_id:
        raise NotFoundError("Invitation", str(invitation_id))

    invitation.status = InvitationStatus.declined
    invitation.responded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(invitation)

    return {
        "message": "Invitation declined",
        "invitation_id": invitation.id,
        "event_id": invitation.event_id,
        "status": "declined",
    }
