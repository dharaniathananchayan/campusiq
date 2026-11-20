<div align="center">

![CampusIQ Banner](banner.png)

# 🎓 CampusIQ
### AI-Powered Campus Event Intelligence &amp; Orchestration Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

<p align="center">
  <b>A unified campus operating system bringing student discovery, persistent discussion forums, capacity enforcement, and multi-turn AI co-pilots into one institutional ecosystem.</b>
</p>

[Quick Start](#-quick-start) • [Features](#-key-features) • [Demo Credentials](#-demo-credentials) • [Architecture](#-architecture) • [API Milestones](#-api-milestones) • [Testing](#-running-tests)

</div>

---

## 🌟 Overview

**CampusIQ** bridges the communication and coordination gap between university administrations, student societies, and attendees. Traditional campus portals rely on disjointed email lists, static bulletins, and unmonitored chat groups. CampusIQ replaces that friction with a unified, modern web application featuring:

- **Dual-Persona Workspaces**: Dedicated **Student Space** (event discovery, registration tracking, schedule, and AI recommendations) and **Organizer Command Center** (event builder, attendee management, ticket capacity enforcement, and analytics).
- **Persistent Discussion Forums**: Dedicated Q&A boards for every event with role badges, like counters, pinned announcements, and organizer moderation.
- **Global Omni-Search**: Instant live search surfacing matching Events, Organizer clubs, and Student profiles with detailed preview modals.
- **AI-Powered Event Intelligence**: Sentence-transformer semantic similarity embeddings for student compatibility scoring (0–100%) and multi-turn Groq LLM assistant/co-pilot workflows.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- *(Optional)* Docker & Docker Compose

---

### Option A – Local Development (Recommended)

#### 1. Backend Setup (FastAPI)
```bash
# Clone the repository
git clone https://github.com/your-username/campusiq.git
cd campusiq

# Create and activate Python virtual environment
python -m venv venv
venv\Scripts\activate          # Windows PowerShell / CMD
# source venv/bin/activate     # macOS / Linux

# Install backend dependencies
pip install -r requirements-dev.txt

# Configure environment variables
cp .env.example .env
# Edit .env: ensure GROQ_API_KEY is configured if testing AI features

# Apply database migrations
alembic upgrade head

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API is now live at `http://127.0.0.1:8000` (Interactive docs at `http://127.0.0.1:8000/docs`).*

#### 2. Frontend Setup (React 19 + Vite)
In a new terminal window:
```bash
cd campusiq/frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend application is now live at `http://localhost:3000` (API calls automatically proxied to port 8000).*

---

### Option B – Docker Deployment

Run all backend services (FastAPI + PostgreSQL + Redis + Celery worker) via Docker Compose:

```bash
cp .env.example .env
# Edit .env with your credentials and API keys

docker-compose up --build
```

---

## 🔑 Demo Credentials

To test both personas immediately without registration, use the pre-seeded demo accounts:

| Persona | Role Toggle | Email | Password | Details |
|---|---|---|---|---|
| **Organizer** | Select **Organizer** | `organizer@campusiq.edu` | `OrgPass123!` | Dr. Sarah Jenkins (Association of Computing) |
| **Student** | Select **Student** | `teststudent@gmail.com` | `StudentPass123!` | Alex Chen (CS, 3rd Year) |

> [!TIP]
> The login page also features fallback offline authentication, enabling full access to student and organizer dashboards even without an active internet connection.

---

## ✨ Key Features

### 1. 💬 Persistent Event Discussion Forums
- **Event-Specific Boards**: Dedicated attendee Q&A channels for each campus session.
- **Persistent Message Storage**: Integrated with synchronized browser storage and FastAPI backend so user messages, replies, and pinned threads are never lost on page refresh.
- **Role & Verified Badges**: Clear visual distinction between registered student attendees and verified faculty/club organizers.
- **Moderation Controls**: Organizers can toggle forum visibility, switch to "organizer-only" announcement mode, or remove disruptive messages and members.

### 2. 🔍 Global Omni-Search
- **Unified Live Dropdown**: Real-time multi-entity search bar in the top navigation.
- **Categorized Results**: Instantly filters results into **Events**, **Organizers**, and **Students**.
- **Interactive Modals**: Click any student profile to view their academic department, skills, and bio; click any organizer to view their mission and all hosted campus events.

### 3. 🎯 Semantic Matching & AI Recommendations
- **0–100 Compatibility Scoring**: Local sentence-transformers embeddings compute student interest alignment against event descriptions and requirements.
- **Personalized Recommendations**: Surfaces high-affinity events tailored to each student's previous registrations, department, and bookmarks.

### 4. 🤖 AI Campus Assistant & Event Co-Pilot
- **Floating Campus Assistant**: Natural language student assistant capable of answering questions about deadlines, prerequisites, room locations, and ticket availability.
- **Organizer Co-Pilot**: Multi-turn conversational planner that transforms rough event descriptions into structured drafts ready to publish in one click.

### 5. 🎟️ Capacity Enforcement & Live Analytics
- **Strict Capacity Gating**: Prevents overbooking with atomic seat reservation and real-time seat countdowns.
- **Live Registration Velocity**: Hourly attendee registration pace, department demographic breakdowns, and capacity utilization metrics.

---

## 🏗️ Architecture

```
campusiq/
├── banner.svg                     # High-resolution vector project banner
├── campusiq.db                    # SQLite dev database (PostgreSQL in production)
├── alembic.ini                    # Alembic migration configuration
├── docker-compose.yml             # Multi-container orchestration
├── Dockerfile                     # Production backend Docker image
├── requirements.txt               # Production Python dependencies
├── requirements-dev.txt           # Development & testing dependencies
│
├── app/                           # FastAPI Backend Application
│   ├── main.py                    # Application factory & CORS middleware
│   ├── core/                      # Configuration, JWT security & exceptions
│   ├── db/                        # Database session & model base definitions
│   ├── models/                    # 14 SQLAlchemy ORM models
│   ├── schemas/                   # Pydantic v2 validation models
│   ├── services/                  # Business logic layer
│   │   ├── ai/                    # Groq client & semantic vector services
│   │   ├── forum_service.py       # Forum Q&A & moderation logic
│   │   └── event_service.py       # Event lifecycle & capacity engine
│   ├── api/v1/endpoints/          # REST route handlers
│   └── tasks/                     # Celery background job definitions
│
├── frontend/                      # React 19 + TypeScript + Vite Application
│   ├── index.html                 # HTML shell
│   ├── vite.config.ts             # Vite configuration with API reverse proxy
│   └── src/
│       ├── main.tsx               # Client entry point
│       ├── App.tsx                # Client routing & authentication guards
│       ├── api/                   # Typed Axios API service modules
│       ├── components/            # UI components
│       │   ├── search/            # Global omni-search & profile modals
│       │   ├── layout/            # Sidebar, navbar, and shell layouts
│       │   ├── views/             # Student & Organizer views
│       │   ├── ai/                # Floating chatbot & copilot windows
│       │   └── EventSpotlight.tsx # Event detail & discussion forum
│       ├── store/                 # Zustand persistent stores
│       └── utils/                 # Forum storage & helper utilities
│
└── tests/                         # Pytest asynchronous test suite
    ├── conftest.py                # Test fixtures & database isolation
    ├── test_auth.py               # Authentication tests
    └── test_events.py             # Event lifecycle & forum moderation tests
```

---

## 📋 API Milestones

### 🛡️ Authentication & Profiles
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/student/register` | Register a new student account |
| `POST` | `/api/v1/auth/organizer/register` | Register a new organizer account |
| `POST` | `/api/v1/auth/student/login` | Student login returning JWT access & refresh tokens |
| `POST` | `/api/v1/auth/organizer/login` | Organizer login returning JWT access & refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh an expired access token |
| `GET` | `/api/v1/students/me` | Fetch authenticated student profile |
| `GET` | `/api/v1/organizers/me` | Fetch authenticated organizer profile |

### 📅 Events & Discovery
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/events` | List events with keyword search, category, and date filters |
| `POST` | `/api/v1/events` | Create a new event draft (Organizer only) |
| `GET` | `/api/v1/events/featured` | Fetch featured campus events |
| `POST` | `/api/v1/events/{id}/publish` | Publish an event draft to the public catalog |
| `POST` | `/api/v1/events/{id}/archive` | Archive an event after completion |
| `GET` | `/api/v1/events/{id}/analytics/live` | Live registration velocity and capacity metrics |

### 💬 Discussion Forum & Moderation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/events/{id}/forum` | Retrieve all discussion threads and queries for an event |
| `POST` | `/api/v1/events/{id}/forum` | Post a question or reply to the event discussion board |
| `PUT` | `/api/v1/events/{id}/forum-controls` | Update forum enablement and access mode (open vs organizer-only) |
| `GET` | `/api/v1/events/{id}/forum-members` | List forum participants and moderation status |
| `POST` | `/api/v1/events/{id}/forum-members/{user_id}/remove` | Remove or ban a disruptive user from the forum |
| `DELETE` | `/api/v1/events/{id}/forum-messages/{message_id}` | Delete an inappropriate message from the forum |

### 🤖 AI Intelligence & Co-Pilot
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/ai/events/match-scores` | Calculate student compatibility scores (0–100%) |
| `POST` | `/api/v1/ai/assistant/chat` | Campus Assistant RAG Q&A with live event retrieval |
| `POST` | `/api/v1/ai/copilot/sessions` | Initialize conversational event planning session |
| `POST` | `/api/v1/ai/copilot/sessions/{id}/apply` | Generate published event directly from Co-Pilot conversation |

---

## 🧪 Running Tests

CampusIQ features comprehensive end-to-end and unit test suites:

```bash
# 1. Run all backend tests
pytest tests/ -v

# 2. Run event & forum moderation tests specifically
pytest tests/test_events.py -v

# 3. Run authentication & token tests
pytest tests/test_auth.py -v

# 4. Run frontend TypeScript & production build check
cd frontend
npm run build
```

---

## 🌐 Free Cloud Deployment Guide

CampusIQ can be hosted **100% free** using standard developer tiers:
- **Frontend**: **Vercel** (Global CDN, fast Vite build)
- **Backend API**: **Render.com** (Free Web Service tier)
- **Database**: Default SQLite file or **Neon.tech** (Free Serverless PostgreSQL)

---

### Step 1: Push Code to GitHub
Ensure your code is pushed to your GitHub repository:
```bash
git init
git add .
git commit -m "feat: CampusIQ production ready"
git remote add origin https://github.com/<your-username>/campusiq.git
git push -u origin main
```

---

### Step 2: Deploy Backend to Render (Free)
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your `campusiq` repository.
4. Fill in the settings:
   - **Name**: `campusiq-api`
   - **Language**: `Python 3`
   - **Region**: Choose closest to you (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = *(click generate or paste 32+ characters)*
   - `DATABASE_URL` = `sqlite+aiosqlite:///./campusiq.db`
   - `DATABASE_URL_SYNC` = `sqlite:///./campusiq.db`
   - `CORS_ORIGINS` = `["*"]`
   - `GROQ_API_KEY` = *(your Groq API key, optional for AI)*
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://campusiq-api.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project** and import your `campusiq` repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://campusiq-api.onrender.com` *(your Render backend URL from Step 2)*
5. Click **Deploy**.
6. Within 60 seconds, your site is live with a free custom SSL URL (e.g., `https://campusiq.vercel.app`)!

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following keys:

| Variable | Default (Dev) | Description |
|---|---|---|
| `APP_NAME` | `CampusIQ` | Application branding name |
| `DATABASE_URL` | `sqlite+aiosqlite:///./campusiq.db` | Async SQLAlchemy database connection string |
| `SECRET_KEY` | `your-secret-key-at-least-32-chars` | HMAC SHA256 JWT signing key |
| `GROQ_API_KEY` | `gsk_...` | Groq API key for LLM inference |
| `GROQ_MODEL` | `groq/compound-mini` | Primary Groq LLM model identifier |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Local sentence-transformers model name |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed frontend origins for CORS |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
