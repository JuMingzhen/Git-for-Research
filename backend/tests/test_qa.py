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


def test_qa_returns_node_citations(client, seeded_project):
    line = create_student_line(client, seeded_project)
    client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Ablation run",
            "content": "Student A should finish the retrieval ablation before next week.",
        },
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": seeded_project["project_id"],
            "question": "What should Student A finish before next week?",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "answered"
    assert payload["citations"]
    assert payload["citations"][0]["source_type"] == "progress_node"


def test_qa_is_project_scoped_and_returns_insufficient_information(client, seeded_users):
    first_project = client.post(
        "/projects",
        json={
            "title": "Project A",
            "description": None,
            "owner_id": seeded_users["advisor_id"],
        },
    ).json()
    second_project = client.post(
        "/projects",
        json={
            "title": "Project B",
            "description": None,
            "owner_id": seeded_users["advisor_id"],
        },
    ).json()

    first_line = client.post(
        "/lines",
        json={
            "project_id": first_project["id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Student A Line",
            "goal": None,
            "line_type": "personal",
            "parent_line_id": first_project["main_line_id"],
        },
    ).json()
    client.post(
        "/nodes",
        json={
            "project_id": first_project["id"],
            "line_id": first_line["id"],
            "author_id": seeded_users["student_a_id"],
            "title": "Only in project A",
            "content": "This answer only exists in project A history.",
        },
    )

    response = client.post(
        "/qa/ask",
        json={
            "project_id": second_project["id"],
            "question": "What answer only exists in project A history?",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "insufficient_information"
    assert payload["citations"] == []
