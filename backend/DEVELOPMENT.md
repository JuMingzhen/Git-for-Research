# Development Guide

This document fixes the current backend development workflow so later steps stay
consistent and easy to verify.

## Standard Environment

- Dedicated environment: `C:\envs\gfr-backend`
- Preferred interpreter:
  `C:\envs\gfr-backend\python.exe`
- Do not rely on `conda run` on this machine
  - direct interpreter calls are more stable here

## Fixed Commands

Run these from `backend/` unless noted otherwise.

### Install or refresh backend dependencies

```bat
C:\envs\gfr-backend\python.exe -m pip install -e .[dev]
```

Or:

```bat
scripts\install_backend.cmd
```

### Run tests

```bat
C:\envs\gfr-backend\python.exe -m pytest -q
```

Or:

```bat
scripts\run_tests.cmd
```

### Run lint

```bat
C:\envs\gfr-backend\python.exe -m ruff check .
```

### Check and apply migrations

```bat
C:\envs\gfr-backend\python.exe -m alembic current
C:\envs\gfr-backend\python.exe -m alembic upgrade head
```

If you want the app to use a different database, set `GFR_DATABASE_URL` before
running Alembic or the app.

## Current Engineering Rules

- Keep the existing backend package structure stable
- Do not change business semantics unless the current step explicitly asks for it
- Prefer adding tests together with new behavior
- Keep AI integrations behind replaceable service interfaces
- Update `API_CONTRACT.md` whenever an endpoint contract changes
- Add a new Alembic revision whenever schema changes are intentional

## Done Definition For Each Future Step

A backend step counts as complete only if all of the following are true:

1. The requested feature is implemented without breaking earlier behavior.
2. The database schema change, if any, is represented in Alembic.
3. The API contract is reflected in `API_CONTRACT.md`.
4. New behavior has automated tests covering:
   - at least one happy path
   - important invalid input or state checks
   - at least one edge or failure path when relevant
5. `ruff check .` passes.
6. `pytest -q` passes.
7. If the step changes startup or workflow expectations, this file is updated.

## Completed Milestones So Far

- Step 1: backend foundation, dependency injection, error handling, tests
- Step 2: projects and research branches
- Step 3: progress updates plus AI summary and sub-branch suggestion flow
- Step 4: meetings, briefing, meeting summary, and task split flow
- Step 5: project-local history QA with required citations and insufficient-information fallback
- Branch lineage upgrade: student branch graphs now support multi-parent merge milestones via `parent_branch_ids`
