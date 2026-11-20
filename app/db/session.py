"""Async SQLAlchemy engine and session factory with SQLite and PostgreSQL support."""
from __future__ import annotations

import logging
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL

# Fallback to SQLite if DATABASE_URL isn't set or is defaulting to local PostgreSQL when unavailable
if "sqlite" in db_url:
    engine_kwargs = {
        "echo": settings.DEBUG,
        "connect_args": {"check_same_thread": False},
    }
else:
    engine_kwargs = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)
