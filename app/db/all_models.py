"""
Import all ORM models so Alembic can auto-detect them for migrations.

This file is imported by alembic/env.py. Keep model imports here, NOT in base.py.
"""
# noqa: F401
from app.models.student import Student
from app.models.organizer import Organizer
from app.models.category import Category
from app.models.venue import Venue
from app.models.event import Event
from app.models.registration import Registration
from app.models.feedback import Feedback
from app.models.bookmark import Bookmark
from app.models.notification import Notification
from app.models.invitation import Invitation
from app.models.interest_profile import InterestProfile
from app.models.feedback_analysis import FeedbackAnalysis
from app.models.copilot_session import CopilotSession
from app.models.rag_session import RAGSession
from app.models.announcement import EventAnnouncement
from app.models.forum import EventForumMessage
from app.models.forum_moderation import EventForumRemovedMember
