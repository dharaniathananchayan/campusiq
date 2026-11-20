"""RAG Campus Assistant – Retrieval-Augmented Generation powered by Groq."""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventStatus
from app.models.category import Category
from app.models.venue import Venue
from app.models.rag_session import RAGSession
from app.schemas.ai import AssistantChatResponse
from app.services.ai.gemini_client import generate_chat_response, get_embedding

_RAG_SYSTEM_PROMPT = (
    "You are CampusIQ Assistant, an intelligent campus event helper. "
    "You help students and organizers discover events, answer questions about schedules, "
    "registrations, venues, and campus event information.\n"
    "Use the provided context to answer accurately. If information is not in the context, "
    "say so honestly. Be conversational, helpful, and concise. "
    "Always reference specific event names, dates, and venues when available."
)


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _event_to_text(event: Event) -> str:
    organizer_name = event.organizer.organization_name if event.organizer else "Unknown"
    category_name = event.category.name if event.category else "General"
    venue_name = event.venue.name if event.venue else "TBD"
    return (
        f"Event: {event.title}\n"
        f"Category: {category_name}\n"
        f"Organizer: {organizer_name}\n"
        f"Venue: {venue_name}\n"
        f"Start: {event.start_datetime.strftime('%B %d, %Y %I:%M %p UTC')}\n"
        f"Deadline: {event.registration_deadline.strftime('%B %d, %Y')}\n"
        f"Seats: {event.current_registrations}/{event.max_capacity}\n"
        f"Tags: {', '.join(event.tags or [])}\n"
        f"Fee: {'Free' if event.registration_fee == 0 else f'Rs.{event.registration_fee}'}\n"
        f"Description: {(event.description or '')[:400]}"
    )


async def chat_with_assistant(
    user_id: uuid.UUID,
    user_type: str,
    message: str,
    db: AsyncSession,
    session_id: uuid.UUID | None = None,
) -> AssistantChatResponse:
    """Process a RAG-augmented chat message and return a Groq-generated response."""
    now = datetime.now(timezone.utc)

    # Load or create session
    session = None
    if session_id:
        result = await db.execute(
            select(RAGSession).where(
                RAGSession.id == session_id,
                RAGSession.user_id == user_id,
            )
        )
        session = result.scalars().first()

    if not session:
        session = RAGSession(
            user_id=user_id,
            user_type=user_type,
            conversation_history=[],
        )
        db.add(session)
        await db.flush()

    # ── Retrieval: find top-K relevant events ─────────────────────────────────
    events_result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.venue),
        )
        .where(Event.status == EventStatus.published)
        .order_by(Event.start_datetime.asc())
        .limit(50)
    )
    events = list(events_result.scalars().all())

    # Embed the query and score events
    try:
        query_emb = await get_embedding(message)
        scored: List[tuple[float, Event]] = []
        for event in events:
            if event.embedding:
                sim = _cosine_similarity(query_emb, event.embedding)
            else:
                # Keyword fallback
                text_lower = _event_to_text(event).lower()
                words = message.lower().split()
                sim = sum(1 for w in words if w in text_lower) / max(1, len(words)) * 0.5
            scored.append((sim, event))
        scored.sort(key=lambda x: x[0], reverse=True)
        top_events = [e for _, e in scored[:5]]
    except Exception:
        top_events = events[:5]

    # Load categories and venues for broad context
    cats_result = await db.execute(select(Category).where(Category.is_active == True))
    categories = list(cats_result.scalars().all())
    venues_result = await db.execute(select(Venue).where(Venue.is_available == True))
    venues = list(venues_result.scalars().all())

    # ── Build augmented context ───────────────────────────────────────────────
    ctx_lines = ["=== RELEVANT CAMPUS EVENTS ==="]
    for ev in top_events:
        ctx_lines.append(_event_to_text(ev))
        ctx_lines.append("---")
    ctx_lines.append("\n=== CATEGORIES ===")
    ctx_lines.append(", ".join(f"{c.name}" for c in categories))
    ctx_lines.append("\n=== VENUES ===")
    for v in venues[:5]:
        ctx_lines.append(f"- {v.name} (capacity: {v.capacity})")
    context = "\n".join(ctx_lines)

    # ── Build message history for Groq ────────────────────────────────────────
    history = session.conversation_history or []
    # Take last 10 turns to stay within context window
    recent_history = history[-10:]

    groq_messages: List[dict] = []
    for msg in recent_history:
        groq_messages.append({"role": msg["role"], "content": msg["content"]})

    # Append current message with context injected
    groq_messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {message}",
    })

    # ── Generate response via Groq ────────────────────────────────────────────
    try:
        answer = await generate_chat_response(
            messages=groq_messages,
            system_instruction=_RAG_SYSTEM_PROMPT,
            temperature=0.7,
            max_output_tokens=1024,
        )
    except Exception:
        answer = "I'm temporarily unable to answer. Please try again in a moment."

    # Update session history (store clean messages without context)
    history.append({"role": "user", "content": message, "timestamp": now.isoformat()})
    history.append({"role": "assistant", "content": answer, "timestamp": now.isoformat()})
    session.conversation_history = history[-40:]  # Keep last 20 turns

    await db.commit()
    await db.refresh(session)

    sources = [{"type": "event", "id": str(e.id), "title": e.title} for e in top_events]
    return AssistantChatResponse(
        session_id=session.id,
        message=answer,
        role="assistant",
        timestamp=now,
        sources=sources,
    )


async def get_sessions(user_id: uuid.UUID, db: AsyncSession) -> List[RAGSession]:
    result = await db.execute(
        select(RAGSession)
        .where(RAGSession.user_id == user_id)
        .order_by(RAGSession.updated_at.desc())
        .limit(20)
    )
    return list(result.scalars().all())


async def delete_session(
    session_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> None:
    result = await db.execute(
        select(RAGSession).where(
            RAGSession.id == session_id,
            RAGSession.user_id == user_id,
        )
    )
    session = result.scalars().first()
    if not session:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Session")
    await db.delete(session)
    await db.commit()
