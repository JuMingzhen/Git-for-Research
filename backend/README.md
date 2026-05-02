# Git for Research Backend

This directory contains the phase 1 backend implementation for Git for Research.

## Standard Environment

The backend now uses a dedicated conda environment stored at:

`C:\envs\gfr-backend`

Use the environment's Python executable directly instead of relying on `conda run`.

### Recommended commands

- Run tests:
  `C:\envs\gfr-backend\python.exe -m pytest -q`
- Install dependencies after backend changes:
  `C:\envs\gfr-backend\python.exe -m pip install -e .[dev]`
- Windows helper scripts:
  `scripts\run_tests.cmd`
  `scripts\install_backend.cmd`

## Phase 1, Step 1

Step 1 focuses on the backend engineering foundation:

- FastAPI app bootstrap
- settings management
- database engine and session wiring
- dependency injection seams for LLM and retrieval services
- consistent error responses
- a small automated test suite

Later steps will add business models and feature APIs on top of this base.
