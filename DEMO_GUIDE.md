# Git for Research Demo Guide

This guide explains how to run the current backend + frontend demo end to end.

## 1. Backend Setup

The repo already standardizes on this backend environment:

- Python: `C:\envs\gfr-backend\python.exe`
- Working directory: [backend](D:\资料\dev\Git_for_Research\backend)

Install or refresh backend dependencies:

```bat
cd backend
C:\envs\gfr-backend\python.exe -m pip install -e .[dev]
```

Apply migrations:

```bat
cd backend
C:\envs\gfr-backend\python.exe -m alembic upgrade head
```

## 2. Seed Demo Data

The frontend demo expects a small fixed dataset so the advisor and student routes
open with meaningful content.

Important:

- The seed script is deterministic.
- It refuses to run against a non-empty database.
- If you want a fresh demo run, start from a clean local `backend/gfr.db`.

Run:

```bat
cd backend
C:\envs\gfr-backend\python.exe scripts\seed_demo_data.py
```

Expected demo IDs after seeding:

- `project_id = 1`
- `advisor_id = 1`
- `student_a_id = 2`
- `student_b_id = 3`
- `student_a_branch_id = 2`
- `student_b_branch_id = 3`

## 3. Start Backend

Run the FastAPI backend from `backend/`:

```bat
cd backend
C:\envs\gfr-backend\python.exe -m uvicorn gfr_backend.main:app --reload
```

Default backend base URL used by the frontend:

- `http://127.0.0.1:8000`

## 4. Frontend Setup

Install frontend dependencies:

```bat
cd frontend
npm.cmd install
```

Create the local env file:

```bat
cd frontend
copy .env.example .env.local
```

The default `.env.example` already points at:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 5. Start Frontend

Run the frontend app:

```bat
cd frontend
npm.cmd run dev
```

Open:

- `http://127.0.0.1:3000/demo`

## 6. Demo Routes

- Demo entry: `http://127.0.0.1:3000/demo`
- Advisor workspace: `http://127.0.0.1:3000/advisor/project/1`
- Student A workspace: `http://127.0.0.1:3000/student/student-a/project/1`
- Student B workspace: `http://127.0.0.1:3000/student/student-b/project/1`

## 7. Recommended Demo Sequence

Use this order for the clearest walkthrough:

1. Open `/demo`
   - explain the three role entry points
2. Open `/advisor/project/1`
   - show the project DAG
   - show meeting briefing / summary / task reflux
   - ask one history QA question
3. Open `/student/student-a/project/1`
   - show the personal DAG with merge milestone
   - show update timeline
   - show task inbox
   - submit one new progress update
4. Optionally open `/student/student-b/project/1`
   - contrast a second student lane and different AI/update state
5. Return to advisor
   - show the product as one closed coordination loop

## 8. Verification Commands

Frontend checks:

```bat
cd frontend
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Backend checks:

```bat
cd backend
C:\envs\gfr-backend\python.exe -m pytest -q
C:\envs\gfr-backend\python.exe -m ruff check .
```

## 9. Current Demo Scope

This demo intentionally focuses on the MVP loop only:

- advisor overview
- student personal workspace
- meeting closure
- task reflux
- history QA with citations

It does not include:

- real login
- role-based auth
- multi-tenant organization management
- rich multimedia inputs
- complex vector retrieval
