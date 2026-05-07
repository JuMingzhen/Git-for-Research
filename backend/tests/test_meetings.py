def create_student_line(client, seeded_project):
    response = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Student A Line",
            "goal": "Own retrieval direction.",
            "line_type": "personal",
            "parent_line_id": seeded_project["main_line_id"],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_meeting_flow_and_generic_tasks(client, seeded_project):
    line = create_student_line(client, seeded_project)
    node_response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Progress before meeting",
            "content": "Completed the first retrieval prototype.",
            "blockers": "Need cleaner benchmark data.",
            "next_step": "Run ablation experiments.",
        },
    )
    assert node_response.status_code == 201

    meeting_response = client.post(
        "/meetings",
        json={
            "project_id": seeded_project["project_id"],
            "title": "Weekly group meeting",
            "raw_notes": "Student A should refine the retrieval baseline.",
        },
    )
    assert meeting_response.status_code == 201
    meeting_id = meeting_response.json()["id"]

    briefing_response = client.post(f"/meetings/{meeting_id}/briefing")
    assert briefing_response.status_code == 200
    assert briefing_response.json()["briefing_status"] == "completed"

    summary_response = client.post(f"/meetings/{meeting_id}/summarize")
    assert summary_response.status_code == 200
    assert summary_response.json()["summary_status"] == "completed"

    task_response = client.post(f"/meetings/{meeting_id}/split-tasks")
    assert task_response.status_code == 200
    task_payload = task_response.json()
    assert task_payload["task_split_status"] == "completed"
    assert len(task_payload["tasks"]) == 1
    task = task_payload["tasks"][0]
    assert task["project_id"] == seeded_project["project_id"]
    assert task["assignee_name"] == "Student A"
    updated_task_response = client.patch(
        f"/meeting-tasks/{task['id']}",
        json={"status": "in_progress"},
    )
    assert updated_task_response.status_code == 200
    assert updated_task_response.json()["status"] == "in_progress"

    project_tasks_response = client.get(f"/projects/{seeded_project['project_id']}/tasks")
    assert project_tasks_response.status_code == 200
    assert len(project_tasks_response.json()) == 1


def test_meeting_ai_failures_do_not_block(client, seeded_project, app):
    class FailingMeetingLLM:
        @property
        def name(self) -> str:
            return "failing-meeting-llm"

        def summarize_progress(self, *, nodes, line_context):
            return "ok"

        def suggest_subbranches(self, *, update_text, line_context):
            return []

        def build_pre_meeting_brief(self, *, project_context, recent_nodes):
            raise RuntimeError("brief fail")

        def summarize_meeting(self, *, raw_notes, project_context):
            raise RuntimeError("summary fail")

        def extract_meeting_tasks(self, *, meeting_summary, participants):
            raise RuntimeError("tasks fail")

    from gfr_backend.api.dependencies import get_llm_service

    app.dependency_overrides[get_llm_service] = FailingMeetingLLM
    meeting_response = client.post(
        "/meetings",
        json={
            "project_id": seeded_project["project_id"],
            "title": "Failure meeting",
            "raw_notes": "Notes",
        },
    )
    assert meeting_response.status_code == 201
    meeting_id = meeting_response.json()["id"]

    assert client.post(f"/meetings/{meeting_id}/briefing").json()["briefing_status"] == "failed"
    assert client.post(f"/meetings/{meeting_id}/summarize").json()["summary_status"] == "failed"
    assert (
        client.post(f"/meetings/{meeting_id}/split-tasks").json()["task_split_status"]
        == "failed"
    )
