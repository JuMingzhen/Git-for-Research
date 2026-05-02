from gfr_backend.db.models.branch import BranchType


def _create_project(client, advisor_id: int, title: str) -> dict:
    response = client.post(
        "/projects",
        json={
            "title": title,
            "description": f"{title} description",
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
            "parent_branch_id": project["main_branch_id"],
            "owner_id": owner_id,
            "title": title,
            "goal": f"Goal for {title}",
            "branch_type": BranchType.personal.value,
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_update(client, branch_id: int, author_id: int, content: str, next_step: str) -> None:
    response = client.post(
        "/updates",
        json={
            "branch_id": branch_id,
            "author_id": author_id,
            "content": content,
            "blockers": None,
            "next_step": next_step,
        },
    )
    assert response.status_code == 201


def _create_meeting_and_summary(client, project_id: int, raw_notes: str) -> dict:
    meeting = client.post(
        "/meetings",
        json={
            "project_id": project_id,
            "title": "Weekly Meeting",
            "scheduled_at": "2026-05-03T10:00:00",
            "raw_notes": raw_notes,
        },
    ).json()
    summarized = client.post(f"/meetings/{meeting['id']}/summarize")
    assert summarized.status_code == 200
    return summarized.json()


def test_qa_returns_answer_and_citations(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"], "QA Project")
    branch = _create_personal_branch(
        client,
        project,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    _create_update(
        client,
        branch["id"],
        seeded_users["student_a_id"],
        "We switched to a retrieval baseline.",
        "Run controlled ablation next week.",
    )
    _create_meeting_and_summary(
        client,
        project["id"],
        "Student A should finish the retrieval ablation before next week.",
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": project["id"],
            "question": "What should Student A finish before next week?",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "answered"
    assert body["answer"].startswith("Based on project history:")
    assert len(body["citations"]) >= 1
    assert any(
        "finish the retrieval ablation before next week" in citation["snippet"].lower()
        for citation in body["citations"]
    )


def test_qa_response_always_contains_citation_sources(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"], "Citation Project")
    branch = _create_personal_branch(
        client,
        project,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    _create_update(
        client,
        branch["id"],
        seeded_users["student_a_id"],
        "Prepared the benchmark draft.",
        "Share the benchmark draft in the next meeting.",
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": project["id"],
            "question": "What was prepared?",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["citations"]
    for citation in body["citations"]:
        assert citation["source_type"] in {"meeting", "progress_update"}
        assert isinstance(citation["source_id"], int)
        assert citation["snippet"]


def test_qa_is_isolated_by_project(client, seeded_users) -> None:
    project_a = _create_project(client, seeded_users["advisor_id"], "Project A")
    branch_a = _create_personal_branch(
        client,
        project_a,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    _create_update(
        client,
        branch_a["id"],
        seeded_users["student_a_id"],
        "Secret alpha result.",
        "Keep iterating on alpha.",
    )

    project_b = _create_project(client, seeded_users["advisor_id"], "Project B")
    branch_b = _create_personal_branch(
        client,
        project_b,
        seeded_users["student_b_id"],
        "Student B Branch",
    )
    _create_update(
        client,
        branch_b["id"],
        seeded_users["student_b_id"],
        "Public beta result.",
        "Keep iterating on beta.",
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": project_b["id"],
            "question": "What is the alpha result?",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "insufficient_information"
    assert body["citations"] == []


def test_qa_returns_insufficient_information_when_nothing_matches(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"], "Empty QA Project")
    branch = _create_personal_branch(
        client,
        project,
        seeded_users["student_a_id"],
        "Student A Branch",
    )
    _create_update(
        client,
        branch["id"],
        seeded_users["student_a_id"],
        "Cleaned experiment logs.",
        "Review them tomorrow.",
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": project["id"],
            "question": "What did the team decide about satellite hardware procurement?",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "answer": "Insufficient information in project history.",
        "status": "insufficient_information",
        "citations": [],
    }
