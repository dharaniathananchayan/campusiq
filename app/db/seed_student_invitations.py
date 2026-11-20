"""Seed realistic AI & organizer invitations for teststudent@gmail.com."""
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

DB_PATH = "campusiq.db"

def seed_invitations():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Find teststudent
    c.execute("SELECT id, full_name, email FROM students WHERE email = 'teststudent@gmail.com'")
    student = c.fetchone()
    if not student:
        print("ERROR: teststudent@gmail.com not found!")
        conn.close()
        return

    student_id = student[0]
    print(f"Found student: {student[1]} ({student[2]}) -> {student_id}")

    # Find top published events
    c.execute("""
        SELECT e.id, e.title, e.organizer_id, o.organization_name, o.full_name
        FROM events e
        JOIN organizers o ON e.organizer_id = o.id
        WHERE e.status = 'published'
        LIMIT 6
    """)
    events = c.fetchall()
    if not events:
        print("ERROR: No published events found!")
        conn.close()
        return

    # Clear existing invitations for teststudent to allow clean re-seeding
    c.execute("DELETE FROM invitations WHERE student_id = ?", (student_id,))
    print(f"Cleared existing invitations for {student_id}")

    now = datetime.now(timezone.utc)

    invitation_templates = [
        {
            "match_score": 0.96,
            "status": "pending",
            "message": "Hi Test Student! Based on your high affinity for autonomous agent workflows and deep learning, our organizing committee personally invites you to join the Campus AI Hackathon 2026. A mentor seat and GPU cluster credits have been allocated for you.",
            "sent_days_ago": 1,
        },
        {
            "match_score": 0.92,
            "status": "pending",
            "message": "You have been specially selected for the Generative AI & LLM Fine-Tuning Bootcamp! Our lab mentors recognized your strong technical focus and would love to have you participate in the hands-on LoRA tuning session.",
            "sent_days_ago": 2,
        },
        {
            "match_score": 0.89,
            "status": "pending",
            "message": "The engineering alumni network is gathering tier-1 tech recruiters for a closed-door networking breakout. Your student profile stood out for fast-track interview matches at this career fair.",
            "sent_days_ago": 3,
        },
        {
            "match_score": 0.85,
            "status": "accepted",
            "message": "Welcome to the Quantum Computing & Algorithms Seminar! Dr. Alain Aspect's lecture panel looks forward to engaging discussion on superconducting qubits.",
            "sent_days_ago": 5,
        },
    ]

    inserted = 0
    for i, ev in enumerate(events[:len(invitation_templates)]):
        ev_id, ev_title, org_id, org_name, org_lead = ev
        tpl = invitation_templates[i]

        inv_id = uuid.uuid4().hex
        sent_at = (now - timedelta(days=tpl["sent_days_ago"])).strftime("%Y-%m-%d %H:%M:%S")
        responded_at = (now - timedelta(days=tpl["sent_days_ago"] - 1)).strftime("%Y-%m-%d %H:%M:%S") if tpl["status"] == "accepted" else None
        created_at = sent_at
        updated_at = now.strftime("%Y-%m-%d %H:%M:%S")

        c.execute("""
            INSERT INTO invitations (
                id, event_id, student_id, organizer_id,
                ai_match_score, status, personalized_message,
                sent_at, responded_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inv_id, ev_id, student_id, org_id,
            tpl["match_score"], tpl["status"], tpl["message"],
            sent_at, responded_at, created_at, updated_at
        ))
        inserted += 1
        print(f" -> Created {tpl['status']} invitation for '{ev_title}' (Org: {org_name})")

    conn.commit()
    conn.close()
    print(f"Successfully seeded {inserted} invitations for teststudent@gmail.com!")

if __name__ == "__main__":
    seed_invitations()
