# API Contract

## MVP Freeze

This document is now the frozen MVP v1 backend contract for frontend
integration. During the current frontend integration window:

- do not rename response fields casually
- do not switch payloads to camelCase
- do not change list ordering semantics without updating this file and tests
- do not change status-string meanings without updating this file and tests

This document records the backend API surface that is currently implemented.
It is the contract frontend and backend work should follow unless we explicitly
change an endpoint in a later phase.

## Base Rules

- Base URL: backend service root
- Content type: `application/json`
- Success responses use route-specific JSON bodies
- Errors use one shared envelope
- All request and response fields use `snake_case`
- Identifier fields use `*_id`
- Timestamps are ISO-8601 datetime strings

## Stable Naming And Ordering Rules

- `branches` in project responses are ordered by ascending `id`
- `parent_branch_ids` in branch responses are ordered by ascending `id`
- `child_branch_ids` in branch detail responses are ordered by ascending `id`
- `tasks` in meeting responses are ordered by ascending `id`
- `GET /branches/{branch_id}/updates` returns newest-first ordering
- `citations` in QA responses are returned in retrieval ranking order
- Update AI state uses:
  - `ai_summary`
  - `ai_suggested_subbranches`
  - `ai_status`
  - `ai_error`
- Meeting AI state uses per-step fields:
  - `ai_briefing` with `briefing_status` and `briefing_error`
  - `ai_summary` with `summary_status` and `summary_error`
  - `tasks` with `task_split_status` and `task_split_error`

## Error Format

All handled errors return:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": []
  }
}
```

### Error Codes In Use

- `http_error`
  - Used for handled HTTP exceptions such as `400` and `404`
- `validation_error`
  - Used for request validation failures with `422`
- `internal_error`
  - Used for unexpected server errors with `500`

## Health Endpoints

### `GET /health`

- Purpose: lightweight liveness check

Response `200`:

```json
{
  "status": "ok"
}
```

### `GET /ready`

- Purpose: readiness check for database and injected services

Response `200`:

```json
{
  "status": "ok",
  "database": "ok",
  "llm_service": "fake-llm",
  "retriever_service": "fake-retriever"
}
```

## Project Endpoints

### `POST /projects`

- Purpose: create a project and automatically create its main branch

Request body:

```json
{
  "title": "Multimodal Research Assistant",
  "description": "Phase 1 MVP project.",
  "owner_id": 1
}
```

Response `201`:

```json
{
  "id": 1,
  "title": "Multimodal Research Assistant",
  "description": "Phase 1 MVP project.",
  "owner_id": 1,
  "status": "active",
  "main_branch_id": 1,
  "branches": [
    {
      "id": 1,
      "project_id": 1,
      "parent_branch_ids": [],
      "owner_id": 1,
      "title": "Main Branch",
      "goal": "Primary research track for Multimodal Research Assistant",
      "status": "active",
      "branch_type": "main",
      "created_at": "2026-05-02T12:00:00"
    }
  ]
}
```

Common errors:

- `400` when `owner_id` is not an advisor
- `404` when `owner_id` does not exist

### `GET /projects/{project_id}`

- Purpose: fetch one project with its current branches

Response `200`: same shape as `POST /projects`

Common errors:

- `404` when `project_id` does not exist

## Branch Endpoints

### `POST /branches`

- Purpose: create personal branches and sub-branches

Request body:

```json
{
  "project_id": 1,
  "parent_branch_ids": [1],
  "owner_id": 2,
  "title": "Student A Branch",
  "goal": "Own the data pipeline direction.",
  "branch_type": "personal"
}
```

Response `201`:

```json
{
  "id": 2,
  "project_id": 1,
  "parent_branch_ids": [1],
  "owner_id": 2,
  "title": "Student A Branch",
  "goal": "Own the data pipeline direction.",
  "status": "active",
  "branch_type": "personal",
  "created_at": "2026-05-02T12:00:00",
  "child_branch_ids": []
}
```

Business constraints currently enforced:

- `main` branches cannot be created through this API
- personal branches must have exactly one parent and that parent must be the project's main branch
- personal branches must be owned by student users
- sub-branches cannot be created directly under the main branch
- sub-branches can have one or more parent branches
- sub-branches must stay under parent branches owned by the same user
- all parent branches and the target project must match
- duplicate parent ids are rejected

### `GET /branches/{branch_id}`

- Purpose: fetch one branch with its direct parent ids and child ids

Response `200`: same shape as `POST /branches`

### `GET /branches/{branch_id}/updates`

- Purpose: list progress updates for one branch
- Ordering: newest first

Response `200`:

```json
[
  {
    "id": 2,
    "branch_id": 2,
    "author_id": 2,
    "content": "Built prototype.",
    "blockers": "Evaluation is still noisy.",
    "next_step": "Run controlled tests.",
    "ai_summary": "Summary for Student A Branch: Built prototype.",
    "ai_suggested_subbranches": [
      "Student A Branch - experiment follow-up",
      "Student A Branch - analysis follow-up"
    ],
    "ai_status": "completed",
    "ai_error": null,
    "created_at": "2026-05-02T12:00:00"
  }
]
```

Common errors:

- `404` when `branch_id` does not exist

## Progress Update Endpoints

### `POST /updates`

- Purpose: store a progress update and attempt AI enrichment

Request body:

```json
{
  "branch_id": 2,
  "author_id": 2,
  "content": "Finished the first retrieval prototype.",
  "blockers": "Need cleaner benchmark data.",
  "next_step": "Run ablation experiments."
}
```

Response `201`:

```json
{
  "id": 1,
  "branch_id": 2,
  "author_id": 2,
  "content": "Finished the first retrieval prototype.",
  "blockers": "Need cleaner benchmark data.",
  "next_step": "Run ablation experiments.",
  "ai_summary": "Summary for Student A Branch: Finished the first retrieval prototype.",
  "ai_suggested_subbranches": [
    "Student A Branch - experiment follow-up",
    "Student A Branch - analysis follow-up"
  ],
  "ai_status": "completed",
  "ai_error": null,
  "created_at": "2026-05-02T12:00:00"
}
```

Behavior note:

- The update is persisted even if AI enrichment fails
- On AI failure:
  - `ai_status` becomes `"failed"`
  - `ai_summary` may be `null`
  - `ai_suggested_subbranches` may be `[]`
  - `ai_error` records the failure text

Common errors:

- `400` when a non-owner tries to update a branch
- `404` when `branch_id` or `author_id` does not exist

## Meeting Endpoints

### `POST /meetings`

- Purpose: create a meeting node under one project

Request body:

```json
{
  "project_id": 1,
  "title": "Weekly Group Meeting",
  "scheduled_at": "2026-05-03T10:00:00",
  "raw_notes": "Student A should refine baseline. Student B should tighten evaluation."
}
```

Response `201`:

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Weekly Group Meeting",
  "scheduled_at": "2026-05-03T10:00:00",
  "raw_notes": "Student A should refine baseline. Student B should tighten evaluation.",
  "ai_briefing": null,
  "briefing_status": "pending",
  "briefing_error": null,
  "ai_summary": null,
  "summary_status": "pending",
  "summary_error": null,
  "task_split_status": "pending",
  "task_split_error": null,
  "created_at": "2026-05-02T12:00:00",
  "tasks": []
}
```

Common errors:

- `404` when `project_id` does not exist

### `GET /meetings/{meeting_id}`

- Purpose: fetch one meeting node with current AI fields and created tasks

Response `200`: same shape as `POST /meetings`

Common errors:

- `404` when `meeting_id` does not exist

### `POST /meetings/{meeting_id}/briefing`

- Purpose: generate pre-meeting briefing from project context and recent updates

Response `200`:

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Weekly Group Meeting",
  "scheduled_at": "2026-05-03T10:00:00",
  "raw_notes": "Student A should refine baseline. Student B should tighten evaluation.",
  "ai_briefing": "Briefing for Meeting Project: 2 updates",
  "briefing_status": "completed",
  "briefing_error": null,
  "ai_summary": null,
  "summary_status": "pending",
  "summary_error": null,
  "task_split_status": "pending",
  "task_split_error": null,
  "created_at": "2026-05-02T12:00:00",
  "tasks": []
}
```

Behavior note:

- If AI fails, the endpoint still returns `200`
- Failure is represented by:
  - `briefing_status = "failed"`
  - `briefing_error` containing the failure reason

### `POST /meetings/{meeting_id}/summarize`

- Purpose: generate a post-meeting summary from raw meeting notes

Response `200`:

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Weekly Group Meeting",
  "scheduled_at": "2026-05-03T10:00:00",
  "raw_notes": "Student A should refine baseline. Student B should tighten evaluation.",
  "ai_briefing": "Briefing for Meeting Project: 2 updates",
  "briefing_status": "completed",
  "briefing_error": null,
  "ai_summary": "Meeting summary for Meeting Project: Student A should refine baseline. Student B should tighten evaluation.",
  "summary_status": "completed",
  "summary_error": null,
  "task_split_status": "pending",
  "task_split_error": null,
  "created_at": "2026-05-02T12:00:00",
  "tasks": []
}
```

Behavior note:

- If AI fails, the endpoint still returns `200`
- Failure is represented by:
  - `summary_status = "failed"`
  - `summary_error` containing the failure reason

### `POST /meetings/{meeting_id}/split-tasks`

- Purpose: extract tasks from the meeting summary or notes and return them to student branches

Response `200`:

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Weekly Group Meeting",
  "scheduled_at": "2026-05-03T10:00:00",
  "raw_notes": "Student A should refine baseline. Student B should tighten evaluation.",
  "ai_briefing": "Briefing for Meeting Project: 2 updates",
  "briefing_status": "completed",
  "briefing_error": null,
  "ai_summary": "Meeting summary for Meeting Project: Student A should refine baseline. Student B should tighten evaluation.",
  "summary_status": "completed",
  "summary_error": null,
  "task_split_status": "completed",
  "task_split_error": null,
  "created_at": "2026-05-02T12:00:00",
  "tasks": [
    {
      "id": 1,
      "meeting_id": 1,
      "assignee_id": 2,
      "branch_id": 2,
      "description": "Task for Student A Branch: Meeting summary for Meeting Project: Student A should refine baseline. Student B should tighten evaluation.",
      "due_hint": "before next meeting",
      "status": "todo",
      "created_at": "2026-05-02T12:00:00"
    }
  ]
}
```

Behavior notes:

- Tasks are only created after generated task-branch relationships pass validation
- If AI fails, the endpoint still returns `200`
- If generated tasks point to the wrong project branch or wrong assignee, the endpoint still returns `200`
- In both failure cases:
  - `task_split_status = "failed"`
  - `task_split_error` explains the reason
  - `tasks` remains empty

## QA Endpoints

### `POST /qa/ask`

- Purpose: answer a question from project-local meeting history and progress history
- Retrieval strategy:
  - intentionally simple and deterministic for now
  - searches current project meetings and updates only
  - no vector database is used yet

Request body:

```json
{
  "project_id": 1,
  "question": "What should Student A finish before next week?"
}
```

Response `200` when history is found:

```json
{
  "answer": "Based on project history: Student A should finish the retrieval ablation before next week.",
  "status": "answered",
  "citations": [
    {
      "source_type": "meeting",
      "source_id": 1,
      "snippet": "Student A should finish the retrieval ablation before next week."
    }
  ]
}
```

Response `200` when history is insufficient:

```json
{
  "answer": "Insufficient information in project history.",
  "status": "insufficient_information",
  "citations": []
}
```

Behavior rules:

- Answers must always come from project-local retrieved history
- Returned answers always include citation sources when `status = "answered"`
- If retrieval does not find enough evidence, the system returns `insufficient_information`
- The system should not fabricate unsupported answers

Common errors:

- `404` when `project_id` does not exist
