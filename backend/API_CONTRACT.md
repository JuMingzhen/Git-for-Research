# API Contract

This document records the current line/node backend contract.

## Base Rules

- Base URL: backend service root
- Content type: `application/json`
- All request and response fields use `snake_case`
- Errors use the shared envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": []
  }
}
```

## Core Semantics

- `Project` is the repo-like container
- `ResearchLine` is the working line, similar to a Git branch
- `ProgressNode` is the real DAG node, similar to a Git commit
- A normal update creates a node with one parent
- A merge update creates a node with multiple parents
- Meeting tasks are generic project task prompts and do not belong to any line

## Stable Ordering Rules

- `lines` in project responses are ordered by ascending `id`
- `GET /projects/{project_id}/meetings` returns newest first
- `GET /projects/{project_id}/tasks` returns newest first
- `GET /lines/{line_id}/nodes` returns newest first
- `GET /projects/{project_id}/graph` returns nodes ordered by ascending `id`
- graph `edges` are ordered by `(parent_node_id, child_node_id)`

## Health Endpoints

### `GET /health`

```json
{"status": "ok"}
```

### `GET /ready`

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

Creates:
- one project
- one `main` line
- one root `initial` node

Request:

```json
{
  "title": "Graph Research Project",
  "description": "Node-first backend.",
  "owner_id": 1
}
```

Response shape:

```json
{
  "id": 1,
  "title": "Graph Research Project",
  "description": "Node-first backend.",
  "owner_id": 1,
  "status": "active",
  "main_line_id": 1,
  "lines": [
    {
      "id": 1,
      "project_id": 1,
      "owner_id": 1,
      "owner_name": "Advisor A",
      "title": "Main Line",
      "goal": "Primary research track for Graph Research Project",
      "line_type": "main",
      "parent_line_id": null,
      "base_node_id": 1,
      "head_node_id": 1,
      "status": "active",
      "created_at": "2026-05-07T12:00:00"
    }
  ]
}
```

### `GET /projects/{project_id}`

Returns the same shape as `POST /projects`.

### `GET /projects/{project_id}/lines`

Returns:

```json
[
  {
    "id": 2,
    "project_id": 1,
    "owner_id": 2,
    "owner_name": "Student A",
    "title": "Student A Line",
    "goal": "Own retrieval direction.",
    "line_type": "personal",
    "parent_line_id": 1,
    "base_node_id": 1,
    "head_node_id": 1,
    "status": "active",
    "created_at": "2026-05-07T12:10:00"
  }
]
```

### `GET /projects/{project_id}/graph`

Returns the project DAG for frontend rendering.

```json
{
  "project_id": 1,
  "main_line_id": 1,
  "lines": [...],
  "nodes": [
    {
      "id": 1,
      "project_id": 1,
      "line_id": 1,
      "line_title": "Main Line",
      "author_id": 1,
      "author_name": "Advisor A",
      "title": "Project initialized",
      "content": "Project Graph Research Project initialized.",
      "blockers": null,
      "next_step": null,
      "node_kind": "initial",
      "parent_node_ids": [],
      "ai_summary": "Initial project node created.",
      "ai_suggested_subbranches": [],
      "ai_status": "completed",
      "ai_error": null,
      "created_at": "2026-05-07T12:00:00"
    }
  ],
  "edges": []
}
```

## Line Endpoints

### `POST /lines`

Creates `personal` or `sub` lines.

Request:

```json
{
  "project_id": 1,
  "owner_id": 2,
  "title": "Experiment Line",
  "goal": "Run ablation experiments.",
  "line_type": "sub",
  "parent_line_id": 2
}
```

Rules:

- `main` lines cannot be created through this API
- `personal` lines must be created from the project's `main` line
- `personal` lines must be owned by students
- `sub` lines must be created from a line owned by the same user
- `sub` lines cannot be created directly from the `main` line

### `GET /lines/{line_id}`

Returns one line in the same shape used above.

## Node Endpoints

### `POST /nodes`

Creates a progress node.

Normal update:

```json
{
  "project_id": 1,
  "line_id": 3,
  "author_id": 2,
  "title": "Finish baseline",
  "content": "Completed first retrieval baseline.",
  "blockers": "Need cleaner labels.",
  "next_step": "Run ablation."
}
```

Merge update:

```json
{
  "project_id": 1,
  "line_id": 2,
  "author_id": 2,
  "title": "Merge experiment and plotting",
  "content": "Integrated both split tracks.",
  "parent_node_ids": [4, 7, 9]
}
```

Rules:

- if `parent_node_ids` is omitted, the line's current `head_node_id` is used
- if multiple parents are given, the new node becomes a merge node
- merge updates must include the target line's current head node
- after node creation, the target line's `head_node_id` is advanced to the new node
- the node is stored even if AI enrichment fails

Response shape:

```json
{
  "id": 10,
  "project_id": 1,
  "line_id": 2,
  "line_title": "Student A Line",
  "author_id": 2,
  "author_name": "Student A",
  "title": "Merge experiment and plotting",
  "content": "Integrated both split tracks.",
  "blockers": null,
  "next_step": null,
  "node_kind": "merge",
  "parent_node_ids": [4, 7, 9],
  "ai_summary": "Summary for Student A Line: Integrated both split tracks.",
  "ai_suggested_subbranches": [
    "Student A Line - experiment follow-up",
    "Student A Line - analysis follow-up"
  ],
  "ai_status": "completed",
  "ai_error": null,
  "created_at": "2026-05-07T12:20:00"
}
```

### `GET /nodes/{node_id}`

Returns one node in the same shape as `POST /nodes`.

### `GET /lines/{line_id}/nodes`

Returns newest-first node history for one line.

## Meeting Endpoints

### `POST /meetings`

Creates one meeting node under a project.

### `GET /meetings/{meeting_id}`

Returns:

```json
{
  "id": 1,
  "project_id": 1,
  "title": "Weekly group meeting",
  "scheduled_at": null,
  "raw_notes": "Student A should refine the baseline.",
  "ai_briefing": null,
  "briefing_status": "pending",
  "briefing_error": null,
  "ai_summary": null,
  "summary_status": "pending",
  "summary_error": null,
  "task_split_status": "pending",
  "task_split_error": null,
  "created_at": "2026-05-07T12:30:00",
  "tasks": []
}
```

### `POST /meetings/{meeting_id}/briefing`

Generates a pre-meeting briefing from recent project nodes.

### `POST /meetings/{meeting_id}/summarize`

Generates a post-meeting summary from notes.

### `POST /meetings/{meeting_id}/split-tasks`

Generates generic project task prompts.

Behavior:

- tasks do not belong to any line
- tasks are generic prompts shown in side panels
- AI failure does not block the meeting flow

## Meeting Task Endpoints

### `GET /projects/{project_id}/tasks`

Returns newest-first task prompts:

```json
[
  {
    "id": 1,
    "meeting_id": 1,
    "project_id": 1,
    "assignee_id": 2,
    "assignee_name": "Student A",
    "description": "Task for Student A: refine the retrieval baseline.",
    "due_hint": "before next meeting",
    "status": "todo",
    "created_at": "2026-05-07T12:35:00"
  }
]
```

### `GET /meeting-tasks/{task_id}`

Returns one task in the same shape.

### `PATCH /meeting-tasks/{task_id}`

Request:

```json
{"status": "in_progress"}
```

Rules:

- empty or whitespace-only status is rejected

## QA Endpoint

### `POST /qa/ask`

Request:

```json
{
  "project_id": 1,
  "question": "What did Student A finish?"
}
```

Behavior:

- searches only the current project's meetings and progress nodes
- if enough evidence exists, returns `status = "answered"` with citations
- otherwise returns `status = "insufficient_information"`

Answered response:

```json
{
  "answer": "Based on project history: Finished the first ablation round.",
  "status": "answered",
  "citations": [
    {
      "source_type": "progress_node",
      "source_id": 8,
      "snippet": "Finished the first ablation round."
    }
  ]
}
```

Insufficient response:

```json
{
  "answer": "Insufficient information in project history.",
  "status": "insufficient_information",
  "citations": []
}
```
