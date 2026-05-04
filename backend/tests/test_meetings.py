from gfr_backend.db.models.branch import BranchType


def _create_project(client, advisor_id: int, title: str = "Meeting Project") -> dict:
    response = client.post(
        "/projects",
        json={
            "title": title,
            "description": "Used for meeting tests.",
            "owner_id": advisor_id,
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_personal_branch(client, project: dict, owner_id: int, title: str) -> dict:
    response = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_ids": [project["main_branch_id"]],
            "owner_id": owner_id,
            "title": title,
            "goal": f"Goal for {title}",
            "branch_type": BranchType.personal.value,
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_update(client, branch_id: int, author_id: int, content: str) -> dict:
    response = client.post(
        "/updates",
        json={
            "branch_id": branch_id,
            "author_id": author_id,
            "content": content,
            "blockers": None,
            "next_step": "Keep going.",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_meeting_happy_path_with_task_split(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    branch_a = _create_personal_branch(
        client,
        project,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    branch_b = _create_personal_branch(
        client,
        project,
        seeded_users["student_b_id"],
        "Student B Branch",
    )
    _create_update(
        client,
        branch_a["id"],
        seeded_users["student_a_id"],
        "Built the first baseline.",
    )
    _create_update(
        client,
        branch_b["id"],
        seeded_users["student_b_id"],
        "Reviewed evaluation setup.",
    )

    create_response = client.post(
        "/meetings",
        json={
            "project_id": project["id"],
            "title": "Weekly Group Meeting",
            "scheduled_at": "2026-05-03T10:00:00",
            "raw_notes": "Student A should refine baseline. Student B should tighten evaluation.",
        },
    )
    assert create_response.status_code == 201
    meeting = create_response.json()

    get_response = client.get(f"/meetings/{meeting['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Weekly Group Meeting"

    briefing_response = client.post(f"/meetings/{meeting['id']}/briefing")
    assert briefing_response.status_code == 200
    briefing_body = briefing_response.json()
    assert briefing_body["briefing_status"] == "completed"
    assert briefing_body["ai_briefing"] == "Briefing for Meeting Project: 2 updates"

    summary_response = client.post(f"/meetings/{meeting['id']}/summarize")
    assert summary_response.status_code == 200
    summary_body = summary_response.json()
    assert summary_body["summary_status"] == "completed"
    assert (
        summary_body["ai_summary"]
        == "Meeting summary for Meeting Project: "
        "Student A should refine baseline. Student B should tighten evaluation."
    )

    split_response = client.post(f"/meetings/{meeting['id']}/split-tasks")
    assert split_response.status_code == 200
    split_body = split_response.json()
    assert split_body["task_split_status"] == "completed"
    assert len(split_body["tasks"]) == 2

    task_map = {task["branch_id"]: task for task in split_body["tasks"]}
    assert task_map[branch_a["id"]]["assignee_id"] == seeded_users["student_a_id"]
    assert task_map[branch_b["id"]]["assignee_id"] == seeded_users["student_b_id"]

    meeting_after_split = client.get(f"/meetings/{meeting['id']}")
    assert meeting_after_split.status_code == 200
    assert len(meeting_after_split.json()["tasks"]) == 2


def test_create_meeting_rejects_unknown_project(client, seeded_users) -> None:
    response = client.post(
        "/meetings",
        json={
            "project_id": 999,
            "title": "Invalid Meeting",
            "scheduled_at": None,
            "raw_notes": None,
        },
    )

    assert response.status_code == 404
    assert response.json()["error"]["message"] == "Project 999 was not found."


def test_briefing_rejects_unknown_meeting(client) -> None:
    response = client.post("/meetings/999/briefing")

    assert response.status_code == 404
    assert response.json()["error"]["message"] == "Meeting 999 was not found."


class BrokenMeetingLLM:
    @property
    def name(self) -> str:
        return "broken-meeting-llm"

    def summarize_progress(self, *, updates, branch_context):  # pragma: no cover
        raise RuntimeError("unused in this test")

    def suggest_subbranches(self, *, update_text, branch_context):  # pragma: no cover
        raise RuntimeError("unused in this test")

    def build_pre_meeting_brief(self, *, project_context, recent_updates) -> str:
        raise RuntimeError("briefing failed")

    def summarize_meeting(self, *, raw_notes: str, project_context) -> str:
        raise RuntimeError("summary failed")

    def extract_meeting_tasks(self, *, meeting_summary: str, participants) -> list[dict]:
        raise RuntimeError("task split failed")


def test_meeting_ai_failures_do_not_block_main_flow(app, client, seeded_users) -> None:
    from gfr_backend.api.dependencies import get_llm_service

    app.dependency_overrides[get_llm_service] = BrokenMeetingLLM
    project = _create_project(client, seeded_users["advisor_id"], title="Failure Project")
    branch = _create_personal_branch(
        client,
        project,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    _create_update(client, branch["id"], seeded_users["student_a_id"], "Prepared input data.")

    meeting = client.post(
        "/meetings",
        json={
            "project_id": project["id"],
            "title": "Failure Meeting",
            "scheduled_at": None,
            "raw_notes": "Need fallback behavior.",
        },
    ).json()

    briefing = client.post(f"/meetings/{meeting['id']}/briefing")
    assert briefing.status_code == 200
    assert briefing.json()["briefing_status"] == "failed"
    assert briefing.json()["briefing_error"] == "briefing failed"

    summary = client.post(f"/meetings/{meeting['id']}/summarize")
    assert summary.status_code == 200
    assert summary.json()["summary_status"] == "failed"
    assert summary.json()["summary_error"] == "summary failed"

    split = client.post(f"/meetings/{meeting['id']}/split-tasks")
    assert split.status_code == 200
    assert split.json()["task_split_status"] == "failed"
    assert split.json()["task_split_error"] == "task split failed"
    assert split.json()["tasks"] == []


class InvalidTaskLLM:
    def __init__(self, invalid_branch_id: int, invalid_assignee_id: int) -> None:
        self.invalid_branch_id = invalid_branch_id
        self.invalid_assignee_id = invalid_assignee_id

    @property
    def name(self) -> str:
        return "invalid-task-llm"

    def summarize_progress(self, *, updates, branch_context):  # pragma: no cover
        raise RuntimeError("unused in this test")

    def suggest_subbranches(self, *, update_text, branch_context):  # pragma: no cover
        raise RuntimeError("unused in this test")

    def build_pre_meeting_brief(self, *, project_context, recent_updates) -> str:
        return "unused"

    def summarize_meeting(self, *, raw_notes: str, project_context) -> str:
        return raw_notes

    def extract_meeting_tasks(
        self,
        *,
        meeting_summary: str,
        participants,
    ) -> list[dict[str, str | int]]:
        return [
            {
                "assignee_id": self.invalid_assignee_id,
                "branch_id": self.invalid_branch_id,
                "description": "Invalid cross-project task.",
                "due_hint": "soon",
            }
        ]


def test_split_tasks_rejects_invalid_branch_association(app, client, seeded_users) -> None:
    from gfr_backend.api.dependencies import get_llm_service

    project_a = _create_project(client, seeded_users["advisor_id"], title="Project A")
    _create_personal_branch(client, project_a, seeded_users["student_a_id"], "A Branch")

    project_b = _create_project(client, seeded_users["advisor_id"], title="Project B")
    branch_b = _create_personal_branch(client, project_b, seeded_users["student_b_id"], "B Branch")

    app.dependency_overrides[get_llm_service] = lambda: InvalidTaskLLM(
        invalid_branch_id=branch_b["id"],
        invalid_assignee_id=seeded_users["student_b_id"],
    )

    meeting = client.post(
        "/meetings",
        json={
            "project_id": project_a["id"],
            "title": "Cross Project Validation Meeting",
            "scheduled_at": None,
            "raw_notes": "Discuss next actions.",
        },
    ).json()

    split = client.post(f"/meetings/{meeting['id']}/split-tasks")
    assert split.status_code == 200
    assert split.json()["task_split_status"] == "failed"
    assert (
        split.json()["task_split_error"]
        == "Generated task branch does not belong to the meeting project."
    )
    assert split.json()["tasks"] == []
