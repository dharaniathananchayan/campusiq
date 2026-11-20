"""Event Co-Pilot – Groq-powered conversational event planning assistant."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.category import Category
from app.models.copilot_session import CopilotSession
from app.models.event import Event, EventStatus
from app.models.venue import Venue
from app.schemas.ai import CopilotChatResponse, CopilotSessionResponse
from app.schemas.event import EligibilityCriteria
from app.services.ai.gemini_client import generate_chat_response

_COPILOT_SYSTEM_PROMPT = """You are CampusIQ Event Co-Pilot, an intelligent event planning assistant for campus organizers.

Your role is to help organizers plan outstanding campus events through natural conversation.
In every response you must:
1. Engage conversationally with the organizer's request
2. Ask clarifying questions when details are missing
3. Generate or refine the event draft progressively
4. Always return a JSON block at the END of your response containing the current event draft state

The JSON block must always use this exact format (include ALL fields, use null for unknown):
```json
{
  "title": "Event title",
  "description": "Full rich description (3-4 paragraphs)",
  "short_description": "One-line summary (max 100 chars)",
  "category": "Technical|Cultural|Sports|Academic|Workshop|Seminar|Social|Career",
  "venue_suggestion": "Suggested venue name (e.g., Main Auditorium, Seminar Hall A)",
  "start_datetime_suggestion": "YYYY-MM-DD HH:MM (24h UTC)",
  "end_datetime_suggestion": "YYYY-MM-DD HH:MM",
  "registration_deadline_suggestion": "YYYY-MM-DD HH:MM",
  "max_capacity": 100,
  "registration_fee": 0,
  "target_audience": "Who should attend",
  "eligibility": {"departments": [], "year_of_study": []},
  "tags": ["tag1", "tag2", "tag3"],
  "promotional_content": "Social media caption / promotional text",
  "activity_plan": ["Activity 1", "Activity 2", "Activity 3"],
  "faqs": [{"q": "Question?", "a": "Answer."}],
  "announcements": ["Pre-event announcement", "Day-of announcement"],
  "contact_email": null,
  "completeness": 0
}
```
The "completeness" field should be 0-100 indicating how complete the event plan is.
Be warm, creative, and proactive. Suggest things the organizer hasn't thought of.
Available campus categories: Technical, Cultural, Sports, Academic, Workshop, Seminar, Social, Career."""


def _extract_json_draft(text: str) -> dict:
    """Extract the JSON draft block from the AI response."""
    try:
        start = text.rfind("```json")
        if start == -1:
            start = text.rfind("```")
        if start == -1:
            return {}
        end = text.rfind("```", start + 3)
        if end == -1:
            return {}
        json_str = text[start:end].replace("```json", "").replace("```", "").strip()
        return json.loads(json_str)
    except (json.JSONDecodeError, ValueError):
        return {}


def _clean_response_text(text: str) -> str:
    """Remove the ```json ... ``` block from the chat response text."""
    start = text.rfind("```json")
    if start == -1:
        start = text.rfind("```")
    if start != -1:
        end = text.rfind("```", start + 3)
        if end != -1:
            clean = text[:start] + text[end + 3:]
            return clean.strip()
        return text[:start].strip()
    return text.strip()




def _get_suggested_actions(draft: dict) -> List[str]:
    """Generate suggested next actions based on current draft completeness."""
    actions = []
    completeness = draft.get("completeness", 0)

    if not draft.get("title"):
        actions.append("Tell me the event name and theme")
    if not draft.get("start_datetime_suggestion"):
        actions.append("Specify the event date and time")
    if not draft.get("venue_suggestion"):
        actions.append("Choose a venue (Main Auditorium, Seminar Hall, etc.)")
    if not draft.get("max_capacity"):
        actions.append("Set the expected attendance capacity")
    if not draft.get("activity_plan"):
        actions.append("Describe the event activities and schedule")
    if not draft.get("faqs"):
        actions.append("Add FAQs for attendees")
    if completeness >= 80:
        actions.append("Apply this draft to create the event")
    if completeness >= 60:
        actions.append("Review and refine the promotional content")

    if not actions:
        actions = ["Ask me to refine any section", "Apply the draft to create the event"]

    return actions[:4]


async def create_session(
    organizer_id: uuid.UUID,
    title: Optional[str],
    initial_message: str,
    db: AsyncSession,
) -> CopilotChatResponse:
    """Start a new Co-Pilot session with the organizer's initial request."""
    # Load available categories and venues for context
    cats_result = await db.execute(select(Category).where(Category.is_active == True))
    categories = [c.name for c in cats_result.scalars().all()]

    venues_result = await db.execute(select(Venue).where(Venue.is_available == True))
    venues_info = [
        f"{v.name} (capacity: {v.capacity})"
        for v in venues_result.scalars().all()
    ]

    context_message = (
        f"Campus Context:\n"
        f"Available categories: {', '.join(categories)}\n"
        f"Available venues: {', '.join(venues_info)}\n\n"
        f"Organizer's request: {initial_message}"
    )

    messages = [{"role": "user", "content": context_message}]

    try:
        response_text = await generate_chat_response(
            messages=messages,
            system_instruction=_COPILOT_SYSTEM_PROMPT,
            temperature=0.8,
            max_output_tokens=2000,
        )
    except Exception as e:
        response_text = f"Welcome! I'm your Event Co-Pilot. I'll help you plan an amazing event. Let me start by asking: {initial_message}\n\nCould you tell me more about the type of event you have in mind?\n\n```json\n{{}}\n```"

    draft = _extract_json_draft(response_text)
    now = datetime.now(timezone.utc)

    session = CopilotSession(
        organizer_id=organizer_id,
        title=title or (draft.get("title") or "New Event Session"),
        conversation_history=[
            {"role": "user", "content": initial_message, "timestamp": now.isoformat()},
            {"role": "assistant", "content": response_text, "timestamp": now.isoformat()},
        ],
        generated_event_draft=draft,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return CopilotChatResponse(
        session_id=session.id,
        message=_clean_response_text(response_text),
        generated_event_draft=draft,
        suggested_actions=_get_suggested_actions(draft),
        timestamp=now,
    )


async def continue_session(
    session_id: uuid.UUID,
    organizer_id: uuid.UUID,
    message: str,
    db: AsyncSession,
) -> CopilotChatResponse:
    """Continue a Co-Pilot conversation turn."""
    result = await db.execute(
        select(CopilotSession).where(
            CopilotSession.id == session_id,
            CopilotSession.organizer_id == organizer_id,
        )
    )
    session = result.scalars().first()
    if not session:
        raise NotFoundError("Copilot session")
    if not session.is_active:
        raise ValidationError("This session has been closed")

    now = datetime.now(timezone.utc)
    history = session.conversation_history or []

    # Build Groq message history (last 12 turns)
    groq_messages: List[dict] = []
    for msg in history[-12:]:
        role = msg.get("role", "user")
        groq_messages.append({"role": role, "content": msg["content"]})
    groq_messages.append({"role": "user", "content": message})

    try:
        response_text = await generate_chat_response(
            messages=groq_messages,
            system_instruction=_COPILOT_SYSTEM_PROMPT,
            temperature=0.8,
            max_output_tokens=2000,
        )
    except Exception:
        response_text = "I encountered an issue processing your request. Could you please rephrase or try again?\n\n```json\n{}\n```"

    new_draft = _extract_json_draft(response_text)

    # Merge with existing draft (new values override, but keep existing non-null values)
    current_draft = session.generated_event_draft or {}
    merged_draft = {**current_draft}
    for k, v in new_draft.items():
        if v is not None and v != "" and v != [] and v != {}:
            merged_draft[k] = v

    # Update session
    history.append({"role": "user", "content": message, "timestamp": now.isoformat()})
    history.append({"role": "assistant", "content": response_text, "timestamp": now.isoformat()})
    session.conversation_history = history[-30:]
    session.generated_event_draft = merged_draft

    await db.commit()
    await db.refresh(session)

    return CopilotChatResponse(
        session_id=session.id,
        message=_clean_response_text(response_text),
        generated_event_draft=merged_draft,
        suggested_actions=_get_suggested_actions(merged_draft),
        timestamp=now,
    )


async def apply_draft_to_event(
    session_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> Event:
    """Convert the Co-Pilot draft into an actual event (in draft status)."""
    result = await db.execute(
        select(CopilotSession).where(
            CopilotSession.id == session_id,
            CopilotSession.organizer_id == organizer_id,
        )
    )
    session = result.scalars().first()
    if not session:
        raise NotFoundError("Copilot session")

    draft = session.generated_event_draft or {}
    if not draft.get("title"):
        raise ValidationError("The event draft is incomplete. At minimum a title is required.")

    # Resolve category
    category_name = draft.get("category", "General")
    cat_result = await db.execute(
        select(Category).where(Category.name.ilike(f"%{category_name}%"))
    )
    category = cat_result.scalars().first()

    # Resolve venue
    venue = None
    if draft.get("venue_suggestion"):
        venue_result = await db.execute(
            select(Venue).where(Venue.name.ilike(f"%{draft['venue_suggestion']}%"))
        )
        venue = venue_result.scalars().first()

    # Parse datetimes
    def _parse_dt(s: Optional[str]) -> Optional[datetime]:
        if not s:
            return None
        formats = ["%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"]
        for fmt in formats:
            try:
                return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        return None

    start_dt = _parse_dt(draft.get("start_datetime_suggestion"))
    end_dt = _parse_dt(draft.get("end_datetime_suggestion"))
    reg_deadline = _parse_dt(draft.get("registration_deadline_suggestion"))

    now = datetime.now(timezone.utc)
    # Fallback: 7 days from now if not set
    if not start_dt:
        from datetime import timedelta
        start_dt = now.replace(hour=10, minute=0, second=0) + __import__("datetime").timedelta(days=7)
    if not end_dt:
        from datetime import timedelta
        end_dt = start_dt + __import__("datetime").timedelta(hours=3)
    if not reg_deadline:
        from datetime import timedelta
        reg_deadline = start_dt - __import__("datetime").timedelta(days=1)

    # Build enriched description
    description_parts = [draft.get("description", draft.get("title", "Event"))]
    if draft.get("activity_plan"):
        description_parts.append(
            "\n## Activity Plan\n" + "\n".join(f"- {a}" for a in draft["activity_plan"])
        )
    if draft.get("faqs"):
        faq_text = "\n## FAQs\n" + "\n".join(
            f"**Q: {f['q']}**\nA: {f['a']}" for f in draft["faqs"]
        )
        description_parts.append(faq_text)

    full_description = "\n\n".join(description_parts) or "Event details to be added."

    event = Event(
        organizer_id=organizer_id,
        category_id=category.id if category else None,
        venue_id=venue.id if venue else None,
        title=draft.get("title", "Untitled Event"),
        description=full_description,
        short_description=draft.get("short_description") or draft.get("title", "")[:100],
        start_datetime=start_dt,
        end_datetime=end_dt,
        registration_deadline=reg_deadline,
        max_capacity=int(draft.get("max_capacity") or 100),
        registration_fee=float(draft.get("registration_fee") or 0.0),
        eligibility_criteria=draft.get("eligibility") or {},
        tags=draft.get("tags") or [],
        contact_email=draft.get("contact_email"),
        status=EventStatus.draft,
    )
    db.add(event)

    # Link session to applied event and close it
    session.applied_event_id = event.id
    session.is_active = False

    await db.commit()
    await db.refresh(event)
    return event


async def get_session(
    session_id: uuid.UUID, organizer_id: uuid.UUID, db: AsyncSession
) -> CopilotSession:
    result = await db.execute(
        select(CopilotSession).where(
            CopilotSession.id == session_id,
            CopilotSession.organizer_id == organizer_id,
        )
    )
    session = result.scalars().first()
    if not session:
        raise NotFoundError("Copilot session")
    return session


async def list_sessions(
    organizer_id: uuid.UUID, db: AsyncSession, page: int = 1, page_size: int = 20
) -> List[CopilotSession]:
    result = await db.execute(
        select(CopilotSession)
        .where(CopilotSession.organizer_id == organizer_id)
        .order_by(CopilotSession.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all())
