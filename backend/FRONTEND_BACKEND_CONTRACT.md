# Frontend Backend Contract

This file is the short frontend-facing summary of the current backend contract.

## Contract Status

- Status: frozen around the `line + node` graph model
- JSON naming: `snake_case`
- IDs: `*_id`
- Datetimes: ISO-8601 strings
- Errors: shared envelope

For full request and response examples, see [API_CONTRACT.md](D:\资料\dev\Git_for_Research\backend\API_CONTRACT.md:1).

## Core Semantics

- `Project` is the repo-like container
- `ResearchLine` is the working line, similar to a Git branch
- `ProgressNode` is the real DAG node, similar to a Git commit
- normal update = one-parent node
- merge update = multi-parent node
- meeting tasks are generic task prompts and do not belong to any line

## Stable Endpoints

- `GET /health`
- `GET /ready`
- `POST /projects`
- `GET /projects/{project_id}`
- `GET /projects/{project_id}/lines`
- `GET /projects/{project_id}/graph`
- `GET /projects/{project_id}/meetings`
- `GET /projects/{project_id}/tasks`
- `POST /lines`
- `GET /lines/{line_id}`
- `GET /lines/{line_id}/nodes`
- `POST /nodes`
- `GET /nodes/{node_id}`
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
  - `id`, `title`, `description`, `owner_id`, `status`, `main_line_id`, `lines`
- Line responses always include:
  - `id`, `project_id`, `owner_id`, `owner_name`, `title`, `goal`, `line_type`, `parent_line_id`, `base_node_id`, `head_node_id`, `status`, `created_at`
- Node responses always include:
  - `id`, `project_id`, `line_id`, `line_title`, `author_id`, `author_name`, `title`, `content`, `blockers`, `next_step`, `node_kind`, `parent_node_ids`, `ai_summary`, `ai_suggested_subbranches`, `ai_status`, `ai_error`, `created_at`
- Graph responses always include:
  - `project_id`, `main_line_id`, `lines`, `nodes`, `edges`
- Meeting responses always include:
  - `id`, `project_id`, `title`, `scheduled_at`, `raw_notes`, `ai_briefing`, `briefing_status`, `briefing_error`, `ai_summary`, `summary_status`, `summary_error`, `task_split_status`, `task_split_error`, `created_at`, `tasks`
- Meeting task items always include:
  - `id`, `meeting_id`, `project_id`, `assignee_id`, `assignee_name`, `description`, `due_hint`, `status`, `created_at`
- QA responses always include:
  - `answer`, `status`, `citations`
- Citation items always include:
  - `source_type`, `source_id`, `snippet`

## Stable Status Meanings

- Node AI:
  - `ai_status = "completed"` means enrichment succeeded
  - `ai_status = "failed"` means the node was still saved but AI enrichment failed
- Meeting briefing:
  - `briefing_status = "pending" | "completed" | "failed"`
- Meeting summary:
  - `summary_status = "pending" | "completed" | "failed"`
- Meeting task split:
  - `task_split_status = "pending" | "completed" | "failed"`
- Meeting task item:
  - current demo flow uses `todo`, `in_progress`, and `done`
- QA:
  - `status = "answered"` means citations were found and returned
  - `status = "insufficient_information"` means frontend should show a safe fallback state

## Error Contract

Handled errors use:

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
- optional `error.details`

## Frontend Integration Notes

- Do not assume camelCase aliases exist
- Do not assume empty strings are used instead of `null`
- Project graph is node-first
  - draw nodes from `nodes`
  - draw edges from `edges`
  - use `lines` only for work-line metadata and current head info
- A merge update is still a `POST /nodes` call
- Meeting tasks should be shown as generic prompts, not as line-bound DAG elements
- When QA returns `insufficient_information`, render that state directly
- When node or meeting AI fields show `failed`, keep the saved resource visible
