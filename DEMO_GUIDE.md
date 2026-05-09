# Git for Research Demo Guide

This guide explains how to run the current backend + frontend demo with the rebuilt `line + node` backend contract.

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

The frontend demo expects a fixed local dataset.

Important:

- The seed script is deterministic.
- It refuses to run against a non-empty database.
- Start from a fresh local `backend/gfr.db` if you want stable IDs.

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
- `main_line_id = 1`
- `student_a_line_id = 2`
- `student_b_line_id = 3`
- `experiment_line_id = 4`
- `plotting_line_id = 5`
- `cleanup_line_id = 6`

## 3. Start Backend

Safest command:

```bat
cd backend
C:\envs\gfr-backend\python.exe -m uvicorn gfr_backend.main:app --host 127.0.0.1 --port 8000
```

If your local Python environment supports it cleanly, you can also use `--reload`.

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

Run:

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

## 7. Recommended Demo Flow

Use this order for the clearest walkthrough:

1. Open `/demo`
   - choose Advisor or a student workspace
2. Open `/advisor/project/1`
   - show the project node graph
   - show the recent meeting cycle
   - show task prompts
   - ask one history QA question
3. Open `/student/student-a/project/1`
   - show the current line and node graph
   - create a sub-line if needed
   - submit one normal update
   - submit one merge update
   - show the task inbox
4. Optionally open `/student/student-b/project/1`
   - contrast a second student's line and task flow
5. Return to Advisor
   - show the same project after the student-side update

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

This demo focuses on the MVP loop:

- advisor overview
- student workspaces
- line splitting and merge updates
- meeting task prompts
- history QA with citations

It does not include:

- real login
- role-based auth
- multi-tenant organization management
- multimedia input
- complex vector retrieval
