"""Utility helpers."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def utcnow() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


def format_datetime_display(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime for human-readable display."""
    if not dt:
        return None
    return dt.strftime("%B %d, %Y at %I:%M %p UTC")
