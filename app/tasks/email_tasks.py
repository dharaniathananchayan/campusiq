"""Email tasks (stub – extend with FastAPI-Mail or SMTP)."""
from __future__ import annotations

from app.tasks.celery_app import celery_app


@celery_app.task(name="tasks.send_email")
def send_email(to_email: str, subject: str, body: str) -> dict:
    """Send an email. Extend with real SMTP/SendGrid logic."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[EMAIL] To: {to_email} | Subject: {subject}")
    # TODO: Integrate FastAPI-Mail / SendGrid for production
    return {"status": "logged", "to": to_email, "subject": subject}
