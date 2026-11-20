"""RAG Assistant and Event Co-Pilot endpoints (Milestone 4)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.core.dependencies import DBSession, AnyUserToken, OrganizerToken
from app.core.exceptions import NotFoundError
from app.schemas.ai import (
    AssistantChatRequest,
    AssistantChatResponse,
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotSessionResponse,
    CopilotStartRequest,
)
from app.schemas.common import MessageResponse
from app.services.ai.rag_service import (
    chat_with_assistant,
    delete_session,
    get_sessions,
)
from app.services.ai.copilot_service import (
    apply_draft_to_event,
    continue_session,
    create_session,
    get_session,
    list_sessions,
)
from app.schemas.event import EventResponse

rag_router = APIRouter(prefix="/ai/assistant", tags=["AI – RAG Assistant"])
copilot_router = APIRouter(prefix="/ai/copilot", tags=["AI – Event Co-Pilot"])


# ── RAG Campus Assistant ───────────────────────────────────────────────────────

@rag_router.post(
    "/chat",
    response_model=AssistantChatResponse,
    summary="Chat with the RAG-powered campus event assistant",
)
async def assistant_chat(
    data: AssistantChatRequest, token: AnyUserToken, db: DBSession
):
    user_id = uuid.UUID(token["sub"])
    user_type = token["role"]
    return await chat_with_assistant(
        user_id=user_id,
        user_type=user_type,
        message=data.message,
        db=db,
        session_id=data.session_id,
    )


@rag_router.get("/sessions", summary="List my RAG assistant sessions")
async def list_rag_sessions(token: AnyUserToken, db: DBSession):
    user_id = uuid.UUID(token["sub"])
    sessions = await get_sessions(user_id, db)
    return [
        {
            "id": str(s.id),
            "user_type": s.user_type,
            "message_count": len(s.conversation_history),
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in sessions
    ]


@rag_router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
    summary="Delete a RAG session",
)
async def delete_rag_session(
    session_id: uuid.UUID, token: AnyUserToken, db: DBSession
):
    user_id = uuid.UUID(token["sub"])
    await delete_session(session_id, user_id, db)
    return MessageResponse(message="Session deleted")


# ── Event Co-Pilot ─────────────────────────────────────────────────────────────

@copilot_router.post(
    "/sessions",
    response_model=CopilotChatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Organizer] Start a new Co-Pilot event planning session",
)
async def start_copilot_session(
    data: CopilotStartRequest, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    return await create_session(
        organizer_id=organizer_id,
        title=data.title,
        initial_message=data.initial_message,
        db=db,
    )


@copilot_router.post(
    "/sessions/{session_id}/chat",
    response_model=CopilotChatResponse,
    summary="[Organizer] Continue Co-Pilot conversation",
)
async def copilot_chat(
    session_id: uuid.UUID,
    data: CopilotChatRequest,
    token: OrganizerToken,
    db: DBSession,
):
    organizer_id = uuid.UUID(token["sub"])
    return await continue_session(
        session_id=session_id,
        organizer_id=organizer_id,
        message=data.message,
        db=db,
    )


@copilot_router.get(
    "/sessions/{session_id}",
    response_model=CopilotSessionResponse,
    summary="[Organizer] Get Co-Pilot session with draft",
)
async def get_copilot_session(
    session_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    return await get_session(session_id, organizer_id, db)


@copilot_router.get(
    "/sessions",
    summary="[Organizer] List all Co-Pilot sessions",
)
async def list_copilot_sessions(token: OrganizerToken, db: DBSession):
    organizer_id = uuid.UUID(token["sub"])
    sessions = await list_sessions(organizer_id, db)
    return [
        CopilotSessionResponse.model_validate(s)
        for s in sessions
    ]


@copilot_router.post(
    "/sessions/{session_id}/apply",
    summary="[Organizer] Apply Co-Pilot draft to create an actual event",
)
async def apply_session_draft(
    session_id: uuid.UUID, token: OrganizerToken, db: DBSession
):
    organizer_id = uuid.UUID(token["sub"])
    event = await apply_draft_to_event(session_id, organizer_id, db)
    return {
        "message": "Event created successfully from Co-Pilot draft",
        "event_id": str(event.id),
        "event_title": event.title,
        "status": event.status.value,
    }
