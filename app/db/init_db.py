"""Database initialisation helpers – seed default data on first run."""
from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
import app.db.all_models  # noqa: F401 – ensure all models are imported for metadata creation


_DEFAULT_CATEGORIES = [
    {"name": "Technical", "slug": "technical", "description": "Hackathons, coding contests, tech talks", "icon": "💻", "color_hex": "#3B82F6"},
    {"name": "Cultural", "slug": "cultural", "description": "Festivals, performances, art exhibitions", "icon": "🎭", "color_hex": "#EC4899"},
    {"name": "Sports", "slug": "sports", "description": "Tournaments, fitness events, inter-college sports", "icon": "🏆", "color_hex": "#F59E0B"},
    {"name": "Academic", "slug": "academic", "description": "Lectures, symposia, research presentations", "icon": "🎓", "color_hex": "#10B981"},
    {"name": "Workshop", "slug": "workshop", "description": "Hands-on learning workshops and training sessions", "icon": "🛠️", "color_hex": "#8B5CF6"},
    {"name": "Seminar", "slug": "seminar", "description": "Guest talks, panel discussions, webinars", "icon": "🎙️", "color_hex": "#06B6D4"},
    {"name": "Social", "slug": "social", "description": "Networking events, social gatherings, club meets", "icon": "🤝", "color_hex": "#F97316"},
    {"name": "Career", "slug": "career", "description": "Job fairs, internship drives, resume workshops", "icon": "💼", "color_hex": "#6366F1"},
]

_DEFAULT_VENUES = [
    {"name": "Main Auditorium", "building": "Main Block", "floor": "Ground", "location_description": "Central auditorium with 1000-seat capacity", "capacity": 1000, "amenities": {"projector": True, "ac": True, "wifi": True, "microphone": True, "stage": True}},
    {"name": "Seminar Hall A", "building": "Academic Block", "floor": "1st Floor", "location_description": "Seminar hall for 200 attendees", "capacity": 200, "amenities": {"projector": True, "ac": True, "wifi": True, "microphone": True}},
    {"name": "Seminar Hall B", "building": "Academic Block", "floor": "2nd Floor", "location_description": "Seminar hall for 150 attendees", "capacity": 150, "amenities": {"projector": True, "ac": True, "wifi": True}},
    {"name": "Conference Room 1", "building": "Admin Block", "floor": "3rd Floor", "location_description": "Small conference room for 30 people", "capacity": 30, "amenities": {"projector": True, "ac": True, "wifi": True, "whiteboard": True}},
    {"name": "Open Air Theatre", "building": "Campus Grounds", "floor": "Ground", "location_description": "Outdoor amphitheatre with seating for 500", "capacity": 500, "amenities": {"stage": True, "microphone": True}},
    {"name": "Computer Lab 1", "building": "CS Block", "floor": "Ground", "location_description": "Computer lab with 60 workstations", "capacity": 60, "amenities": {"computers": True, "projector": True, "ac": True, "wifi": True}},
    {"name": "Sports Complex", "building": "Sports Block", "floor": "Ground", "location_description": "Multi-purpose sports facility", "capacity": 300, "amenities": {"changing_rooms": True, "equipment": True}},
]


async def init_db() -> None:
    """Seed the database with default categories, venues, and sample events (NO USERS created)."""
    from app.models.category import Category
    from app.models.venue import Venue
    from app.models.event import Event, EventStatus

    # Step 1: Create all tables automatically if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        def _ensure_sqlite_columns(connection):
            try:
                result = connection.exec_driver_sql("PRAGMA table_info(events)").fetchall()
                columns = [row[1] for row in result]
                if columns and "is_registration_open" not in columns:
                    connection.exec_driver_sql("ALTER TABLE events ADD COLUMN is_registration_open BOOLEAN DEFAULT 1 NOT NULL")
                if columns and "has_student_forum" not in columns:
                    connection.exec_driver_sql("ALTER TABLE events ADD COLUMN has_student_forum BOOLEAN DEFAULT 0 NOT NULL")
                if columns and "forum_access_mode" not in columns:
                    connection.exec_driver_sql("ALTER TABLE events ADD COLUMN forum_access_mode VARCHAR(50) DEFAULT 'open' NOT NULL")

                student_result = connection.exec_driver_sql("PRAGMA table_info(students)").fetchall()
                student_cols = [row[1] for row in student_result]
                if student_cols and "institute_name" not in student_cols:
                    connection.exec_driver_sql("ALTER TABLE students ADD COLUMN institute_name VARCHAR(255)")
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"SQLite column migration check warning: {e}")
        await conn.run_sync(_ensure_sqlite_columns)

    # Step 2: Seed categories, venues, and sample events
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Seed categories
            result = await session.execute(select(Category).limit(1))
            cat_list = list((await session.execute(select(Category))).scalars().all())
            if not cat_list:
                for cat_data in _DEFAULT_CATEGORIES:
                    c = Category(**cat_data)
                    session.add(c)
                await session.flush()
                cat_list = list((await session.execute(select(Category))).scalars().all())

            # Seed venues
            result = await session.execute(select(Venue).limit(1))
            venue_list = list((await session.execute(select(Venue))).scalars().all())
            if not venue_list:
                for venue_data in _DEFAULT_VENUES:
                    v = Venue(**venue_data)
                    session.add(v)
                await session.flush()
                venue_list = list((await session.execute(select(Venue))).scalars().all())

            # Seed sample events if no events exist (NO USERS created)
            events_exist = (await session.execute(select(Event).limit(1))).scalars().first()
            if not events_exist and cat_list and venue_list:
                tech_cat = next((c for c in cat_list if c.slug == "technical"), cat_list[0])
                cultural_cat = next((c for c in cat_list if c.slug == "cultural"), cat_list[0])
                sports_cat = next((c for c in cat_list if c.slug == "sports"), cat_list[0])
                workshop_cat = next((c for c in cat_list if c.slug == "workshop"), cat_list[0])

                auditorium = next((v for v in venue_list if "Auditorium" in v.name), venue_list[0])
                computer_lab = next((v for v in venue_list if "Lab" in v.name), venue_list[0])
                sports_comp = next((v for v in venue_list if "Sports" in v.name), venue_list[0])

                now = datetime.datetime.now(timezone.utc)

                sample_events = [
                    Event(
                        title="Campus Hackathon 2026",
                        short_description="48-hour competitive coding hackathon with AI & web tracks.",
                        description="Join the annual campus AI & Full-Stack hackathon! Team up with peers, solve real-world industry challenges, and compete for $5,000 in cash prizes and mentorship opportunities.",
                        category_id=tech_cat.id,
                        venue_id=computer_lab.id,
                        start_datetime=now + datetime.timedelta(days=7),
                        end_datetime=now + datetime.timedelta(days=9),
                        registration_deadline=now + datetime.timedelta(days=6),
                        max_capacity=60,
                        current_registrations=12,
                        status=EventStatus.published,
                        eligibility_criteria={"departments": ["Computer Science", "Information Technology"], "year_of_study": [1, 2, 3, 4, 5], "custom_criteria": ""},
                        tags=["ai", "coding", "hackathon", "python"],
                        is_featured=True,
                        registration_fee=0.0,
                        contact_email="hackathon@campus.edu",
                    ),
                    Event(
                        title="AI & Generative Models Hands-On Workshop",
                        short_description="Practical workshop on LLMs, RAG, and fine-tuning open-source models.",
                        description="Learn how to build AI-powered agents using Groq, Llama-3, and vector databases. Hands-on coding exercises provided.",
                        category_id=workshop_cat.id,
                        venue_id=auditorium.id,
                        start_datetime=now + datetime.timedelta(days=12),
                        end_datetime=now + datetime.timedelta(days=12, hours=4),
                        registration_deadline=now + datetime.timedelta(days=11),
                        max_capacity=200,
                        current_registrations=45,
                        status=EventStatus.published,
                        eligibility_criteria={"departments": [], "year_of_study": [], "custom_criteria": "Basic Python knowledge required"},
                        tags=["ai", "workshop", "llm", "groq"],
                        is_featured=True,
                        registration_fee=0.0,
                        contact_email="ai-workshop@campus.edu",
                    ),
                    Event(
                        title="Annual Inter-College Cultural Fest 2026",
                        short_description="Music, dance, drama, and art competitions across 3 stages.",
                        description="Experience the biggest cultural extravaganza of the year! Live band performances, dance face-offs, drama, and food stalls.",
                        category_id=cultural_cat.id,
                        venue_id=auditorium.id,
                        start_datetime=now + datetime.timedelta(days=20),
                        end_datetime=now + datetime.timedelta(days=22),
                        registration_deadline=now + datetime.timedelta(days=18),
                        max_capacity=1000,
                        current_registrations=320,
                        status=EventStatus.published,
                        eligibility_criteria={"departments": [], "year_of_study": [], "custom_criteria": ""},
                        tags=["cultural", "music", "dance", "fest"],
                        is_featured=True,
                        registration_fee=10.0,
                        contact_email="culturalfest@campus.edu",
                    ),
                    Event(
                        title="Inter-Department Basketball Championship",
                        short_description="5v5 basketball tournament for all campus departments.",
                        description="Cheer for your department or register your team for the campus basketball championship trophy!",
                        category_id=sports_cat.id,
                        venue_id=sports_comp.id,
                        start_datetime=now + datetime.timedelta(days=15),
                        end_datetime=now + datetime.timedelta(days=17),
                        registration_deadline=now + datetime.timedelta(days=14),
                        max_capacity=300,
                        current_registrations=80,
                        status=EventStatus.published,
                        eligibility_criteria={"departments": [], "year_of_study": [], "custom_criteria": ""},
                        tags=["sports", "basketball", "tournament"],
                        is_featured=False,
                        registration_fee=0.0,
                        contact_email="sports@campus.edu",
                    ),
                ]

                for e in sample_events:
                    session.add(e)
