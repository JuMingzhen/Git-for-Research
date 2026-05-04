from gfr_backend.db.models.branch import BranchType


def test_mvp_end_to_end_flow_freezes_backend_contract(client, seeded_users) -> None:
    project = client.post(
        "/projects",
        json={
            "title": "Frozen MVP Project",
            "description": "Full flow acceptance test.",
            "owner_id": seeded_users["advisor_id"],
        },
    )
    assert project.status_code == 201
    project_body = project.json()
    assert set(project_body.keys()) == {
        "id",
        "title",
        "description",
        "owner_id",
        "status",
        "main_branch_id",
        "branches",
    }
    assert project_body["status"] == "active"
    assert len(project_body["branches"]) == 1

    branch_a = client.post(
        "/branches",
        json={
            "project_id": project_body["id"],
            "parent_branch_ids": [project_body["main_branch_id"]],
            "owner_id": seeded_users["student_a_id"],
            "title": "Student A Branch",
            "goal": "Own retrieval experiments.",
            "branch_type": BranchType.personal.value,
        },
    )
    assert branch_a.status_code == 201
    branch_a_body = branch_a.json()
    assert set(branch_a_body.keys()) == {
        "id",
        "project_id",
        "parent_branch_ids",
        "owner_id",
        "title",
        "goal",
        "status",
        "branch_type",
        "created_at",
        "child_branch_ids",
    }

    branch_b = client.post(
        "/branches",
        json={
            "project_id": project_body["id"],
            "parent_branch_ids": [project_body["main_branch_id"]],
            "owner_id": seeded_users["student_b_id"],
            "title": "Student B Branch",
            "goal": "Own evaluation workflow.",
            "branch_type": BranchType.personal.value,
        },
    )
    assert branch_b.status_code == 201
    branch_b_body = branch_b.json()

    update_a = client.post(
        "/updates",
        json={
            "branch_id": branch_a_body["id"],
            "author_id": seeded_users["student_a_id"],
            "content": "Student A built the retrieval baseline.",
            "blockers": "Need cleaner benchmark labels.",
            "next_step": "Finish the retrieval ablation before next week.",
        },
    )
    assert update_a.status_code == 201
    update_a_body = update_a.json()
    assert set(update_a_body.keys()) == {
        "id",
        "branch_id",
        "author_id",
        "content",
        "blockers",
        "next_step",
        "ai_summary",
        "ai_suggested_subbranches",
        "ai_status",
        "ai_error",
        "created_at",
    }
    assert update_a_body["ai_status"] == "completed"

    update_b = client.post(
        "/updates",
        json={
            "branch_id": branch_b_body["id"],
            "author_id": seeded_users["student_b_id"],
            "content": "Student B reviewed the evaluation setup.",
            "blockers": None,
            "next_step": "Tighten the evaluation protocol.",
        },
    )
    assert update_b.status_code == 201

    meeting = client.post(
        "/meetings",
        json={
            "project_id": project_body["id"],
            "title": "Weekly Research Meeting",
            "scheduled_at": "2026-05-03T10:00:00",
            "raw_notes": (
                "Student A should finish the retrieval ablation before next week. "
                "Student B should tighten the evaluation protocol."
            ),
        },
    )
    assert meeting.status_code == 201
    meeting_body = meeting.json()
    assert set(meeting_body.keys()) == {
        "id",
        "project_id",
        "title",
        "scheduled_at",
        "raw_notes",
        "ai_briefing",
        "briefing_status",
        "briefing_error",
        "ai_summary",
        "summary_status",
        "summary_error",
        "task_split_status",
        "task_split_error",
        "created_at",
        "tasks",
    }
    assert meeting_body["tasks"] == []

    briefing = client.post(f"/meetings/{meeting_body['id']}/briefing")
    assert briefing.status_code == 200
    assert briefing.json()["briefing_status"] == "completed"

    summary = client.post(f"/meetings/{meeting_body['id']}/summarize")
    assert summary.status_code == 200
    summary_body = summary.json()
    assert summary_body["summary_status"] == "completed"

    split = client.post(f"/meetings/{meeting_body['id']}/split-tasks")
    assert split.status_code == 200
    split_body = split.json()
    assert split_body["task_split_status"] == "completed"
    assert len(split_body["tasks"]) == 2
    task_branch_ids = [task["branch_id"] for task in split_body["tasks"]]
    assert task_branch_ids == sorted(task_branch_ids)

    qa = client.post(
        "/qa/ask",
        json={
            "project_id": project_body["id"],
            "question": "What should Student A finish before next week?",
        },
    )
    assert qa.status_code == 200
    qa_body = qa.json()
    assert set(qa_body.keys()) == {"answer", "status", "citations"}
    assert qa_body["status"] == "answered"
    assert qa_body["citations"]
    assert set(qa_body["citations"][0].keys()) == {"source_type", "source_id", "snippet"}
    assert any(
        "finish the retrieval ablation before next week" in citation["snippet"].lower()
        for citation in qa_body["citations"]
    )
