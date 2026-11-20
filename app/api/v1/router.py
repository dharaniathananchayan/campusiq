"""API v1 router – aggregates all endpoint routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.students import router as students_router
from app.api.v1.endpoints.organizers import router as organizers_router
from app.api.v1.endpoints.categories import categories_router, venues_router
from app.api.v1.endpoints.events import router as events_router
from app.api.v1.endpoints.registrations import router as registrations_router
from app.api.v1.endpoints.bookmarks import router as bookmarks_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.feedback import router as feedback_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.ai.ai_features import router as ai_features_router
from app.api.v1.endpoints.ai.ai_assistant import rag_router, copilot_router

api_router = APIRouter(prefix="/api/v1")

# Milestone 1 – Foundation
api_router.include_router(auth_router)
api_router.include_router(students_router)
api_router.include_router(organizers_router)
api_router.include_router(categories_router)
api_router.include_router(venues_router)
api_router.include_router(events_router)

# Milestone 2 – Discovery & Engagement
api_router.include_router(registrations_router)
api_router.include_router(bookmarks_router)
api_router.include_router(notifications_router)
api_router.include_router(dashboard_router)

# Milestone 3 – Analytics & Intelligence
api_router.include_router(feedback_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_features_router)

# Milestone 4 – AI Assistant & Co-Pilot
api_router.include_router(rag_router)
api_router.include_router(copilot_router)
