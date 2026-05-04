# Frontend Backend Contract

This file is the short, frontend-facing summary of the frozen backend MVP v1
contract. If you are building the frontend, this is the contract you should
depend on.

## Contract Status

- Status: frozen for MVP v1
- JSON naming: `snake_case` only
- IDs: `*_id`
- Datetimes: ISO-8601 strings
- Error envelope: stable

For full examples, see [API_CONTRACT.md](D:\资料\dev\Git_for_Research\backend\API_CONTRACT.md:1).

## Stable Endpoints

- `GET /health`
- `GET /ready`
- `POST /projects`
- `GET /projects/{project_id}`
- `GET /projects/{project_id}/meetings`
- `GET /projects/{project_id}/tasks`
- `POST /branches`
- `GET /branches/{branch_id}`
- `GET /branches/{branch_id}/updates`
- `POST /updates`
- `POST /meetings`
- `GET /meetings/{meeting_id}`
- `POST /meetings/{meeting_id}/briefing`
- `POST /meetings/{meeting_id}/summarize`
- `POST /meetings/{meeting_id}/split-tasks`
- `GET /meeting-tasks/{task_id}`
- `PATCH /meeting-tasks/{task_id}`
- `POST /qa/ask`

## Field Conventions Frontend Can Rely On

- Project responses always include:
  - `id`, `title`, `description`, `owner_id`, `status`, `main_branch_id`, `branches`
- Branch detail responses always include:
  - `id`, `project_id`, `parent_branch_ids`, `owner_id`, `owner_name`, `title`, `goal`, `status`, `branch_type`, `created_at`, `child_branch_ids`
- Update responses always include:
  - `id`, `branch_id`, `author_id`, `content`, `blockers`, `next_step`, `ai_summary`, `ai_suggested_subbranches`, `ai_status`, `ai_error`, `created_at`
- Meeting responses always include:
  - `id`, `project_id`, `title`, `scheduled_at`, `raw_notes`, `ai_briefing`, `briefing_status`, `briefing_error`, `ai_summary`, `summary_status`, `summary_error`, `task_split_status`, `task_split_error`, `created_at`, `tasks`
- Meeting task items always include:
  - `id`, `meeting_id`, `assignee_id`, `assignee_name`, `branch_id`, `branch_title`, `description`, `due_hint`, `status`, `created_at`
- QA responses always include:
  - `answer`, `status`, `citations`
- Citation items always include:
  - `source_type`, `source_id`, `snippet`

## Stable Status Meanings

- Update AI:
  - `ai_status = "completed"` means AI enrichment succeeded
  - `ai_status = "failed"` means the update was still saved but AI enrichment failed
- Meeting briefing:
  - `briefing_status = "pending" | "completed" | "failed"`
- Meeting summary:
  - `summary_status = "pending" | "completed" | "failed"`
- Meeting task split:
  - `task_split_status = "pending" | "completed" | "failed"`
- Meeting task item:
  - `status` is user-editable text
  - current demo flow uses values like `todo`, `in_progress`, and `done`
- QA:
  - `status = "answered"` means citations were found and returned
  - `status = "insufficient_information"` means frontend should show a safe fallback state, not pretend an answer exists

## Error Contract

All handled errors use:

```json
{
  "error": {
    "code": "http_error",
    "message": "Project 999 was not found.",
    "details": []
  }
}
```

Frontend should read:

- `error.code`
- `error.message`
- optionally `error.details`

## Frontend Integration Notes

- Do not assume camelCase aliases exist
- Do not assume empty strings are used instead of `null`
- Branch lineage is a DAG, not a strict tree
  - use `parent_branch_ids` instead of assuming a single parent
- When QA returns `insufficient_information`, render that state directly
- When meeting/update AI fields show `failed`, keep the underlying saved resource visible
