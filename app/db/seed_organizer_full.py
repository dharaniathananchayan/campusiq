"""Comprehensive seeder for existing organizer accounts in CampusIQ."""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

def run_seed():
    conn = sqlite3.connect("campusiq.db")
    c = conn.cursor()

    now = datetime.now(timezone.utc)

    # 1. Fetch reference categories, venues, organizers, students
    categories = c.execute("SELECT id, slug, name FROM categories;").fetchall()
    cat_by_slug = {slug: (cid, name) for cid, slug, name in categories}
    cat_default_id = categories[0][0]

    venues = c.execute("SELECT id, name, capacity FROM venues;").fetchall()
    venue_by_name = {name: (vid, cap) for vid, name, cap in venues}
    venue_default_id = venues[0][0]

    organizers = c.execute("SELECT id, email, organization_name FROM organizers;").fetchall()
    print(f"Found {len(organizers)} existing organizers: {organizers}")

    students = c.execute("SELECT id, full_name, email FROM students;").fetchall()
    print(f"Found {len(students)} existing students.")

    # Update students with realistic names & departments if needed
    real_students_info = [
        ("Alex Rivera", "Computer Science", 3),
        ("Maya Lin", "Information Technology", 2),
        ("Jordan Patel", "Data Science", 4),
        ("Priya Sharma", "Software Engineering", 2),
        ("David Kim", "Computer Science", 1),
        ("Marcus Taylor", "Electrical Engineering", 3),
        ("Aisha Omar", "Information Systems", 2),
        ("Lucas Silva", "Computer Science", 4),
        ("Emily Zhao", "Business Analytics", 3),
        ("Ethan Brown", "Computer Engineering", 2),
        ("Sarah Jenkins", "Design & Media", 3),
        ("Liam O'Connor", "Computer Science", 1),
        ("Chloe Bennett", "Cognitive Science", 2),
        ("Noah Garcia", "Information Technology", 4),
        ("Sophia Martinez", "Human-Computer Interaction", 3),
    ]

    for idx, (s_id, _, _) in enumerate(students):
        if idx < len(real_students_info):
            name, dept, yr = real_students_info[idx]
            c.execute(
                "UPDATE students SET full_name = ?, department = ?, year_of_study = ? WHERE id = ?;",
                (name, dept, yr, s_id)
            )

    student_ids = [s[0] for s in students]

    # 2. Update existing organizers with verified badge and rich info
    for org_id, email, org_name in organizers:
        c.execute(
            """
            UPDATE organizers
            SET is_verified = 1,
                is_active = 1,
                contact_phone = ?,
                website = ?,
                description = ?,
                logo_url = ?
            WHERE id = ?;
            """,
            (
                "+1 (555) 438-9201",
                "https://campusiq.edu/organizations/campus-club",
                f"Official premier student organization representing {org_name}. Dedicated to hosting world-class hackathons, technical workshops, career networking, and campus cultural milestones.",
                "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop",
                org_id
            )
        )

    # 3. Clean up existing events, registrations, feedback, copilot sessions, etc. for fresh rich seed
    print("Clearing previous seed to ensure a consistent, immaculate dataset...")
    c.execute("DELETE FROM invitations;")
    c.execute("DELETE FROM bookmarks;")
    c.execute("DELETE FROM feedback_analyses;")
    c.execute("DELETE FROM feedback;")
    c.execute("DELETE FROM registrations;")
    c.execute("DELETE FROM copilot_sessions;")
    c.execute("DELETE FROM notifications;")
    c.execute("DELETE FROM events;")
    conn.commit()

    # Define Event Blueprints
    event_specs = [
        # Upcoming Published Events
        {
            "title": "Campus AI Hackathon 2026: Agentic Systems",
            "slug_cat": "technical",
            "venue_name": "Computer Lab 1",
            "short_description": "48-hour competitive hackathon building multi-agent AI workflows and autonomous software.",
            "description": "Join over 150 top student developers, AI researchers, and designers. Form teams, build autonomous agent architectures, and pitch before industry venture capitalists and top tech mentors. $10,000 prize pool and fast-track interviews included.",
            "days_start": 7,
            "duration_hours": 48,
            "deadline_days": 5,
            "capacity": 120,
            "status": "published",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["ai", "hackathon", "agents", "python", "fullstack"],
            "dept_eligibility": ["Computer Science", "Information Technology", "Data Science", "Software Engineering"],
            "reg_count": 14,
            "attendance_rate": 0.0,  # upcoming
        },
        {
            "title": "Generative AI & LLM Fine-Tuning Bootcamp",
            "slug_cat": "workshop",
            "venue_name": "Seminar Hall A",
            "short_description": "Hands-on workshop on open-source weights, LoRA fine-tuning, and production RAG pipelines.",
            "description": "A deep-dive technical workshop led by campus AI fellows. Bring your laptop and learn how to optimize open models, quantize neural networks, and deploy cost-effective vector search engines.",
            "days_start": 12,
            "duration_hours": 6,
            "deadline_days": 10,
            "capacity": 80,
            "status": "published",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["ai", "workshop", "llm", "rag", "pytorch"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.0,
        },
        {
            "title": "Annual Inter-College Cultural Extravaganza 2026",
            "slug_cat": "cultural",
            "venue_name": "Main Auditorium",
            "short_description": "Music performances, dance face-offs, indie drama, and campus food village.",
            "description": "The largest festive celebration on campus! Featuring 14 inter-collegiate bands, student theatrical acts, art showcases, and night food bazaar. Open to all students, faculty, and alumni.",
            "days_start": 20,
            "duration_hours": 36,
            "deadline_days": 18,
            "capacity": 600,
            "status": "published",
            "is_featured": 1,
            "fee": 5.0,
            "tags": ["cultural", "music", "dance", "fest", "arts"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.0,
        },
        {
            "title": "Inter-Department 3v3 Basketball Tournament",
            "slug_cat": "sports",
            "venue_name": "Sports Complex",
            "short_description": "Fast-paced half-court basketball championship with prizes for top 3 teams.",
            "description": "Rep your major in the annual 3v3 basketball showdown. Double-elimination format, professional refereeing, and awards ceremony. Refreshments provided for all participants and spectators.",
            "days_start": 15,
            "duration_hours": 8,
            "deadline_days": 13,
            "capacity": 100,
            "status": "published",
            "is_featured": 0,
            "fee": 0.0,
            "tags": ["sports", "basketball", "tournament", "fitness"],
            "dept_eligibility": [],
            "reg_count": 12,
            "attendance_rate": 0.0,
        },
        {
            "title": "Tech Careers & Engineering Alumni Networking Fair",
            "slug_cat": "career",
            "venue_name": "Main Auditorium",
            "short_description": "Direct networking with recruiters, founders, and campus engineering alumni.",
            "description": "Meet hiring managers and engineers from leading tech companies and high-growth startups. Bring printed resumes for on-the-spot portfolio reviews and mock interview feedback.",
            "days_start": 25,
            "duration_hours": 6,
            "deadline_days": 22,
            "capacity": 400,
            "status": "published",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["career", "networking", "internships", "jobs", "tech"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.0,
        },
        {
            "title": "Quantum Computing & Quantum Algorithms Seminar",
            "slug_cat": "seminar",
            "venue_name": "Seminar Hall B",
            "short_description": "Guest talk on quantum supremacy, qubits, and Qiskit simulations.",
            "description": "Featuring visiting research fellow Dr. Jennifer Vance explaining superconductor qubits, quantum error mitigation, and programming quantum circuits with Python.",
            "days_start": 18,
            "duration_hours": 3,
            "deadline_days": 16,
            "capacity": 75,
            "status": "published",
            "is_featured": 0,
            "fee": 0.0,
            "tags": ["quantum", "physics", "computing", "seminar"],
            "dept_eligibility": [],
            "reg_count": 10,
            "attendance_rate": 0.0,
        },
        # Ongoing Event (happening today)
        {
            "title": "Campus Maker Faire & Hardware Expo",
            "slug_cat": "technical",
            "venue_name": "Open Air Theatre",
            "short_description": "Live hardware demonstrations, robotics prototypes, and IoT exhibits running today.",
            "description": "Explore 40+ student invention booths showcasing embedded systems, 3D printing innovations, autonomous rovers, and wearable sensors. Voting for Audience Choice Award ends at 5 PM.",
            "days_start": 0,
            "duration_hours": 8,
            "deadline_days": -1,
            "capacity": 150,
            "status": "published",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["hardware", "maker", "robotics", "iot"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.8,
        },
        # Completed Events (crucial for Past Analytics, Attendance Rate, Ratings, and Feedback)
        {
            "title": "Winter CodeSprint 2025: Algorithmic Battle",
            "slug_cat": "technical",
            "venue_name": "Computer Lab 1",
            "short_description": "High-stakes algorithmic problem-solving sprint across data structures and graph algorithms.",
            "description": "Annual speed coding battle testing algorithmic efficiency, dynamic programming, and systems thinking. Over 100 participants competed across 6 challenging rounds.",
            "days_start": -35,
            "duration_hours": 5,
            "deadline_days": -37,
            "capacity": 120,
            "status": "completed",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["coding", "algorithms", "competitive-programming"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.93,
        },
        {
            "title": "Full-Stack Web Development Bootcamp",
            "slug_cat": "workshop",
            "venue_name": "Seminar Hall A",
            "short_description": "Intensive hands-on weekend constructing modern Next.js and FastAPI cloud applications.",
            "description": "Comprehensive workshop covering modern React architecture, asynchronous REST endpoints, PostgreSQL migrations, and Docker containerization.",
            "days_start": -65,
            "duration_hours": 12,
            "deadline_days": -68,
            "capacity": 80,
            "status": "completed",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["web", "fullstack", "react", "fastapi", "docker"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.87,
        },
        {
            "title": "Career Launchpad: Resume & Mock Interview Clinic",
            "slug_cat": "career",
            "venue_name": "Conference Room 1",
            "short_description": "1-on-1 resume reviews and behavioral mock interviews with FAANG engineers.",
            "description": "Over 80 students received direct personalized feedback on resume structure, STAR method storytelling, and whiteboard technical interview practice.",
            "days_start": -95,
            "duration_hours": 6,
            "deadline_days": -98,
            "capacity": 60,
            "status": "completed",
            "is_featured": 0,
            "fee": 0.0,
            "tags": ["career", "resume", "interviews", "mentorship"],
            "dept_eligibility": [],
            "reg_count": 14,
            "attendance_rate": 0.93,
        },
        {
            "title": "Campus Music Jam & Acoustic Night",
            "slug_cat": "cultural",
            "venue_name": "Open Air Theatre",
            "short_description": "Chill acoustic evening under the campus stars with student vocalists and guitarists.",
            "description": "A cozy, soulful musical night with open-mic performances, chai, and student songwriters. Unanimously rated as one of the best evening experiences of the semester.",
            "days_start": -125,
            "duration_hours": 4,
            "deadline_days": -128,
            "capacity": 200,
            "status": "completed",
            "is_featured": 1,
            "fee": 0.0,
            "tags": ["music", "acoustic", "live", "cultural"],
            "dept_eligibility": [],
            "reg_count": 15,
            "attendance_rate": 0.95,
        },
        # Draft Event
        {
            "title": "Autonomous Robotics & Drone Racing Championship",
            "slug_cat": "technical",
            "venue_name": "Sports Complex",
            "short_description": "FPV drone racing obstacle course and autonomous rover maze navigation.",
            "description": "Planning in progress: Student teams will design high-speed FPV racing quads and program LiDAR rovers to clear our custom indoor obstacle track.",
            "days_start": 45,
            "duration_hours": 10,
            "deadline_days": 40,
            "capacity": 150,
            "status": "draft",
            "is_featured": 0,
            "fee": 0.0,
            "tags": ["robotics", "drones", "engineering", "competition"],
            "dept_eligibility": [],
            "reg_count": 0,
            "attendance_rate": 0.0,
        },
        # Cancelled Event
        {
            "title": "Outdoor Star Gazing & Astronomy Night",
            "slug_cat": "academic",
            "venue_name": "Open Air Theatre",
            "short_description": "Night telescope session cancelled due to forecasted rain and heavy cloud cover.",
            "description": "Observational astronomy session with high-powered campus telescopes. Postponed to next term due to overcast conditions.",
            "days_start": -15,
            "duration_hours": 3,
            "deadline_days": -18,
            "capacity": 60,
            "status": "cancelled",
            "is_featured": 0,
            "fee": 0.0,
            "tags": ["astronomy", "science", "stargazing"],
            "dept_eligibility": [],
            "reg_count": 8,
            "attendance_rate": 0.0,
        },
    ]

    total_events_created = 0
    total_regs_created = 0
    total_feedback_created = 0

    for org_id, org_email, org_name in organizers:
        print(f"\nSeeding events and features for organizer: {org_name} ({org_email})...")

        for spec in event_specs:
            event_id = uuid.uuid4().hex
            cat_id = cat_by_slug.get(spec["slug_cat"], (cat_default_id, "Campus"))[0]
            venue_id, venue_cap = venue_by_name.get(spec["venue_name"], (venue_default_id, 100))

            start_dt = now + timedelta(days=spec["days_start"])
            end_dt = start_dt + timedelta(hours=spec["duration_hours"])
            reg_deadline = start_dt - timedelta(days=max(1, start_dt.day - spec["deadline_days"]))

            eligibility = {
                "departments": spec["dept_eligibility"],
                "year_of_study": [1, 2, 3, 4, 5],
                "custom_criteria": "",
            }

            created_dt = start_dt - timedelta(days=30)

            # Insert Event
            c.execute(
                """
                INSERT INTO events (
                    id, title, description, short_description, organizer_id, category_id,
                    venue_id, start_datetime, end_datetime, registration_deadline,
                    max_capacity, current_registrations, status, eligibility_criteria,
                    tags, banner_url, is_featured, registration_fee, contact_email,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    event_id,
                    spec["title"],
                    spec["description"],
                    spec["short_description"],
                    org_id,
                    cat_id,
                    venue_id,
                    start_dt.strftime("%Y-%m-%d %H:%M:%S"),
                    end_dt.strftime("%Y-%m-%d %H:%M:%S"),
                    reg_deadline.strftime("%Y-%m-%d %H:%M:%S"),
                    spec["capacity"],
                    spec["reg_count"],
                    spec["status"],
                    json.dumps(eligibility),
                    json.dumps(spec["tags"]),
                    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
                    spec["is_featured"],
                    spec["fee"],
                    org_email,
                    created_dt.strftime("%Y-%m-%d %H:%M:%S"),
                    now.strftime("%Y-%m-%d %H:%M:%S"),
                )
            )
            total_events_created += 1

            # Seed Registrations for this event
            reg_count = min(spec["reg_count"], len(student_ids))
            for i in range(reg_count):
                student_id = student_ids[i]
                reg_id = uuid.uuid4().hex

                # Spread registration time across the month leading up to the event
                reg_dt = created_dt + timedelta(days=i * 1.5, hours=i * 2)
                if reg_dt > now:
                    reg_dt = now - timedelta(hours=i + 1)

                if spec["status"] == "completed":
                    # ~90% attended, ~10% cancelled
                    if i < int(reg_count * spec["attendance_rate"]):
                        reg_status = "attended"
                        att_dt = start_dt + timedelta(minutes=15 + i * 3)
                        canc_dt = None
                    else:
                        reg_status = "cancelled"
                        att_dt = None
                        canc_dt = start_dt - timedelta(days=1)
                elif spec["status"] == "cancelled":
                    reg_status = "cancelled"
                    att_dt = None
                    canc_dt = start_dt - timedelta(days=2)
                elif spec["days_start"] == 0:  # Ongoing
                    if i < int(reg_count * 0.7):
                        reg_status = "attended"
                        att_dt = start_dt + timedelta(minutes=20)
                    else:
                        reg_status = "confirmed"
                        att_dt = None
                    canc_dt = None
                else:  # Upcoming
                    if i >= spec["capacity"]:
                        reg_status = "waitlisted"
                    else:
                        reg_status = "confirmed"
                    att_dt = None
                    canc_dt = None

                c.execute(
                    """
                    INSERT INTO registrations (
                        id, student_id, event_id, status, registered_at, cancelled_at, attended_at, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        reg_id,
                        student_id,
                        event_id,
                        reg_status,
                        reg_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        canc_dt.strftime("%Y-%m-%d %H:%M:%S") if canc_dt else None,
                        att_dt.strftime("%Y-%m-%d %H:%M:%S") if att_dt else None,
                        f"Student ID: STU-2026-00{i+1}",
                        reg_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        now.strftime("%Y-%m-%d %H:%M:%S"),
                    )
                )
                total_regs_created += 1

                # Seed student bookmarks for upcoming events
                if spec["status"] == "published" and i % 2 == 0:
                    c.execute(
                        """
                        INSERT INTO bookmarks (id, student_id, event_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?);
                        """,
                        (
                            uuid.uuid4().hex,
                            student_id,
                            event_id,
                            reg_dt.strftime("%Y-%m-%d %H:%M:%S"),
                            now.strftime("%Y-%m-%d %H:%M:%S"),
                        )
                    )

                # Seed student invitations for featured events
                if spec["is_featured"] and i < 6:
                    inv_id = uuid.uuid4().hex
                    match_score = round(0.82 + (i % 5) * 0.04, 2)
                    inv_status = "accepted" if reg_status in ("attended", "confirmed") else "pending"
                    c.execute(
                        """
                        INSERT INTO invitations (
                            id, event_id, student_id, organizer_id, ai_match_score, status,
                            personalized_message, sent_at, responded_at, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """,
                        (
                            inv_id,
                            event_id,
                            student_id,
                            org_id,
                            match_score,
                            inv_status,
                            f"Based on your department curriculum and active interest in {spec['slug_cat']}, this event is an outstanding match.",
                            (start_dt - timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S"),
                            (start_dt - timedelta(days=12)).strftime("%Y-%m-%d %H:%M:%S") if inv_status == "accepted" else None,
                            (start_dt - timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S"),
                            now.strftime("%Y-%m-%d %H:%M:%S"),
                        )
                    )

            # Seed Feedback & Feedback Analysis for completed events
            if spec["status"] == "completed":
                feedback_samples = [
                    (5, "Incredible energy and organization! The guest mentors gave specific, actionable feedback on our project code.", "positive", 0.95),
                    (5, "Hands down the best event I have attended this semester. The problem statements were realistic and challenging.", "positive", 0.98),
                    (4, "Great experience overall! The opening keynotes were inspiring and check-in was very fast via CampusIQ.", "positive", 0.85),
                    (5, "Learned a ton of industry-relevant skills that are never covered in our standard lecture curriculum.", "positive", 0.92),
                    (4, "Very solid workshop. WiFi was a bit slow during the container download section, but mentors handled it nicely.", "positive", 0.78),
                    (5, "Everything ran right on schedule. Loved the snacks and the networking segment with alumni engineers.", "positive", 0.94),
                    (3, "Content was very rich, but pace was a bit fast for beginners without previous Python experience.", "neutral", 0.50),
                    (5, "Super engaging community atmosphere. Met two peers who are now working with me on our capstone project!", "positive", 0.96),
                    (4, "Well worth my Saturday afternoon. Really appreciated the slide decks and GitHub repo shared afterwards.", "positive", 0.88),
                    (5, "Outstanding execution by the organizer team. Will definitely register for the next edition!", "positive", 0.97),
                ]

                ratings_sum = 0
                for fb_idx, (rating, comment, sentiment, score) in enumerate(feedback_samples):
                    if fb_idx >= len(student_ids):
                        break
                    fb_student_id = student_ids[fb_idx]
                    ratings_sum += rating
                    fb_dt = start_dt + timedelta(hours=spec["duration_hours"] + 2 + fb_idx)
                    c.execute(
                        """
                        INSERT INTO feedback (
                            id, student_id, event_id, rating, comment, sentiment, sentiment_score, is_anonymous, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """,
                        (
                            uuid.uuid4().hex,
                            fb_student_id,
                            event_id,
                            rating,
                            comment,
                            sentiment,
                            score,
                            fb_idx % 3 == 0,
                            fb_dt.strftime("%Y-%m-%d %H:%M:%S"),
                            now.strftime("%Y-%m-%d %H:%M:%S"),
                        )
                    )
                    total_feedback_created += 1

                avg_fb_rating = round(ratings_sum / len(feedback_samples), 2)

                # Insert AI Feedback Analysis
                fa_id = uuid.uuid4().hex
                c.execute(
                    """
                    INSERT INTO feedback_analyses (
                        id, event_id, overall_sentiment, avg_rating, total_responses,
                        positive_themes, negative_themes, recommendations, detailed_analysis,
                        analyzed_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        fa_id,
                        event_id,
                        f"Overwhelmingly positive ({round(avg_fb_rating/5 * 100)}% satisfaction score). Attendees praised mentor depth, hands-on structure, and fast check-in.",
                        avg_fb_rating,
                        len(feedback_samples),
                        json.dumps([
                            "High mentor responsiveness and guidance",
                            "Real-world, industry-relevant problem statements",
                            "Seamless check-in and scheduling experience",
                            "Strong peer networking and community building"
                        ]),
                        json.dumps([
                            "Occasional WiFi congestion during heavy repository cloning",
                            "Fast pacing for complete beginners in early rounds"
                        ]),
                        json.dumps([
                            "Pre-configure offline Docker images or local mirrors to reduce WiFi load",
                            "Offer an optional 30-minute primer track for first-year participants",
                            "Extend post-event networking session by 20 minutes"
                        ]),
                        f"The event achieved a stellar {round(spec['attendance_rate']*100)}% attendance rate with high engagement throughout the {spec['duration_hours']}-hour duration. Net Promoter Score indicates high likelihood of repeat attendance.",
                        (start_dt + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
                        (start_dt + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
                        now.strftime("%Y-%m-%d %H:%M:%S"),
                    )
                )

        # 4. Seed AI Copilot Sessions for the organizer
        copilot_sessions = [
            (
                "AI Hackathon 2026 Ideation & Planning",
                [
                    {"role": "user", "content": "I want to organize a 48-hour AI hackathon focusing on autonomous agents for campus students."},
                    {"role": "assistant", "content": "Great idea! For an agentic hackathon, recommend 3 tracks: 1) Campus Life Automation (scheduling, cafeteria, study groups), 2) Academic Research Agents, 3) Open Innovation. Recommended venue: Computer Lab 1 with high-bandwidth power access."},
                    {"role": "user", "content": "Can you give me a structured title, description, and target capacity?"},
                    {"role": "assistant", "content": "Title: 'Campus AI Hackathon 2026: Agentic Systems'. Capacity: 120 students. Registration deadline: 5 days prior to allow team pairing and compute credential distribution."},
                ],
                {
                    "title": "Campus AI Hackathon 2026: Agentic Systems",
                    "category": "technical",
                    "capacity": 120,
                    "target_audience": "CS, IT, Data Science majors"
                }
            ),
            (
                "Spring Career Networking Fair Strategy",
                [
                    {"role": "user", "content": "How can we increase alumni engagement for our engineering career fair?"},
                    {"role": "assistant", "content": "Organize 20-minute lightning panels where alumni talk about transitioning from junior to senior engineer roles, followed by 1-on-1 portfolio review roundtables."},
                    {"role": "user", "content": "Draft an invitation blurb we can send to registered students."},
                    {"role": "assistant", "content": "Here is an engaging blurb: 'Meet engineering leads and campus alumni from top tech startups. Bring your resume for direct 1-on-1 feedback and on-the-spot internship considerations.'"},
                ],
                {
                    "title": "Tech Careers & Engineering Alumni Networking Fair",
                    "category": "career",
                    "capacity": 400,
                }
            ),
            (
                "Drone Championship & Logistics Blueprint",
                [
                    {"role": "user", "content": "What safety measures are needed for an indoor drone obstacle course in the Sports Complex?"},
                    {"role": "assistant", "content": "1) Safety netting enclosing the entire flight perimeter, 2) Propeller guards mandatory for all multirotors, 3) 5.8GHz video frequency coordination board to prevent signal interference, 4) Dual spotters per pilot."},
                ],
                {
                    "title": "Autonomous Robotics & Drone Racing Championship",
                    "category": "technical",
                    "capacity": 150,
                }
            )
        ]

        for s_title, history, draft in copilot_sessions:
            c.execute(
                """
                INSERT INTO copilot_sessions (
                    id, organizer_id, title, conversation_history, generated_event_draft, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    uuid.uuid4().hex,
                    org_id,
                    s_title,
                    json.dumps(history),
                    json.dumps(draft),
                    1,
                    (now - timedelta(days=4)).strftime("%Y-%m-%d %H:%M:%S"),
                    now.strftime("%Y-%m-%d %H:%M:%S"),
                )
            )

        # 5. Seed Notifications for Organizer
        notifications_data = [
            (
                "organizer",
                "confirmation",
                "Venue Booking Confirmed: Main Auditorium",
                "Your reservation for Main Auditorium for 'Annual Inter-College Cultural Extravaganza' has been approved by campus administration.",
                "/organizer/events",
                now - timedelta(days=2)
            ),
            (
                "organizer",
                "new_event",
                "Milestone Reached: 100 Registrations",
                "Campus AI Hackathon 2026 has reached over 100 registered students! Consider reviewing team formation status.",
                "/organizer/attendees",
                now - timedelta(days=1)
            ),
            (
                "organizer",
                "general",
                "AI Feedback Analysis Available",
                "Feedback report generated for Winter CodeSprint 2025. Overall rating: 4.8 / 5.0 with 10 student reviews.",
                "/organizer/analytics",
                now - timedelta(hours=14)
            ),
            (
                "organizer",
                "reminder",
                "Check-in Roster Ready for Today's Event",
                "Campus Maker Faire is live today. Access attendee check-in and QR ticket scanning from your dashboard.",
                "/organizer/attendees",
                now - timedelta(hours=3)
            ),
        ]

        for r_type, n_type, n_title, n_msg, n_url, n_dt in notifications_data:
            c.execute(
                """
                INSERT INTO notifications (
                    id, recipient_id, recipient_type, type, title, message, is_read, metadata, action_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    uuid.uuid4().hex,
                    org_id,
                    r_type,
                    n_type,
                    n_title,
                    n_msg,
                    0,
                    json.dumps({"priority": "high"}),
                    n_url,
                    n_dt.strftime("%Y-%m-%d %H:%M:%S"),
                    n_dt.strftime("%Y-%m-%d %H:%M:%S"),
                )
            )

    conn.commit()
    conn.close()

    print("\n[SUCCESS] SEEDING COMPLETE!")
    print(f"Total events seeded: {total_events_created}")
    print(f"Total registrations seeded: {total_regs_created}")
    print(f"Total feedback entries seeded: {total_feedback_created}")

if __name__ == "__main__":
    run_seed()
