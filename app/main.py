"""CampusIQ FastAPI application factory."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router
from app.db.init_db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup: seed initial data
    try:
        await init_db()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"DB init skipped: {e}")
    yield
    # Shutdown: nothing to clean up (connections handled by engine pool)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "🎓 **CampusIQ** – AI-Powered Campus Event Intelligence & Management Platform\n\n"
            "Built with FastAPI + PostgreSQL + Groq AI + sentence-transformers\n\n"
            "## Features\n"
            "- 🔐 JWT Authentication for Students & Organizers\n"
            "- 📅 Event Creation, Publishing & Management\n"
            "- 🔍 Smart Event Discovery with Search & Filters\n"
            "- 📊 Real-time Analytics & Benchmarking\n"
            "- 🤖 AI Interest Profiling & Event Matching\n"
            "- 🎯 AI Student Targeting & Personalized Invitations\n"
            "- 💬 RAG-Powered Campus Assistant (Groq + semantic search)\n"
            "- 🛠️ AI Event Co-Pilot (Conversational event planning)\n"
            "- 📈 Groq AI Feedback Analysis & Recommendations\n"
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    register_exception_handlers(app)

    # Routes
    app.include_router(api_router)

    # Health check
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    return app


app = create_app()
