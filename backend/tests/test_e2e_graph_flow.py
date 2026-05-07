def test_end_to_end_project_line_node_meeting_qa_flow(client, seeded_project):
    personal_line = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Student A Line",
            "goal": "Own retrieval direction.",
            "line_type": "personal",
            "parent_line_id": seeded_project["main_line_id"],
        },
    ).json()

    experiment_line = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Experiment Line",
            "goal": "Run experiments.",
            "line_type": "sub",
            "parent_line_id": personal_line["id"],
        },
    ).json()

    client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Personal update",
            "content": "Defined the experiment plan.",
        },
    )
    experiment_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": experiment_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Experiment update",
            "content": "Finished the first ablation round.",
        },
    ).json()

    personal_line_refreshed = client.get(f"/lines/{personal_line['id']}").json()
    merge_response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Merge experiment back",
            "content": "Merged the experiment findings back into the main student line.",
            "parent_node_ids": [
                personal_line_refreshed["head_node_id"],
                experiment_update["id"],
            ],
        },
    )
    assert merge_response.status_code == 201

    meeting_response = client.post(
        "/meetings",
        json={
            "project_id": seeded_project["project_id"],
            "title": "Weekly meeting",
            "raw_notes": "Student A should prepare the final write-up.",
        },
    )
    meeting_id = meeting_response.json()["id"]
    client.post(f"/meetings/{meeting_id}/briefing")
    client.post(f"/meetings/{meeting_id}/summarize")
    tasks_payload = client.post(f"/meetings/{meeting_id}/split-tasks").json()
    assert tasks_payload["tasks"]

    qa_payload = client.post(
        "/qa/ask",
        json={
            "project_id": seeded_project["project_id"],
            "question": "What did Student A finish?",
        },
    ).json()
    assert qa_payload["status"] == "answered"
    assert qa_payload["citations"]
