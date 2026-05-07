def test_create_project_creates_main_line_and_root_node(client, seeded_users):
    response = client.post(
        "/projects",
        json={
            "title": "Research Graph",
            "description": "Graph-first backend.",
            "owner_id": seeded_users["advisor_id"],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["main_line_id"] == 1
    assert payload["lines"][0]["line_type"] == "main"
    assert payload["lines"][0]["head_node_id"] is not None
    assert payload["lines"][0]["base_node_id"] is not None


def test_create_personal_and_sub_lines(client, seeded_project):
    personal_response = client.post(
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
    assert personal_response.status_code == 201
    personal_payload = personal_response.json()
    assert personal_payload["line_type"] == "personal"
    assert personal_payload["parent_line_id"] == seeded_project["main_line_id"]
    assert personal_payload["base_node_id"] == personal_payload["head_node_id"]

    sub_response = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Experiment Line",
            "goal": "Run ablation.",
            "line_type": "sub",
            "parent_line_id": personal_payload["id"],
        },
    )
    assert sub_response.status_code == 201
    sub_payload = sub_response.json()
    assert sub_payload["line_type"] == "sub"
    assert sub_payload["parent_line_id"] == personal_payload["id"]


def test_invalid_line_relationships_are_rejected(client, seeded_project):
    response = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Bad Sub Line",
            "goal": None,
            "line_type": "sub",
            "parent_line_id": seeded_project["main_line_id"],
        },
    )
    assert response.status_code == 400

    response = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["advisor_id"],
            "title": "Advisor Personal",
            "goal": None,
            "line_type": "personal",
            "parent_line_id": seeded_project["main_line_id"],
        },
    )
    assert response.status_code == 400


def test_get_project_lines_and_graph(client, seeded_project):
    personal_response = client.post(
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
    assert personal_response.status_code == 201

    lines_response = client.get(f"/projects/{seeded_project['project_id']}/lines")
    assert lines_response.status_code == 200
    assert len(lines_response.json()) == 2

    graph_response = client.get(f"/projects/{seeded_project['project_id']}/graph")
    assert graph_response.status_code == 200
    graph_payload = graph_response.json()
    assert graph_payload["main_line_id"] == seeded_project["main_line_id"]
    assert len(graph_payload["nodes"]) == 1
    assert graph_payload["edges"] == []
