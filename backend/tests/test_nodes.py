def create_personal_line(client, seeded_project):
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


def test_create_progress_node_advances_line_head(client, seeded_project):
    personal_line = create_personal_line(client, seeded_project)
    response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Finish baseline",
            "content": "Completed first retrieval baseline.",
            "blockers": "Need cleaner labels.",
            "next_step": "Run ablation.",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["node_kind"] == "update"
    assert len(payload["parent_node_ids"]) == 1
    assert payload["ai_status"] == "completed"

    line_response = client.get(f"/lines/{personal_line['id']}")
    assert line_response.status_code == 200
    assert line_response.json()["head_node_id"] == payload["id"]


def test_create_merge_node_with_multiple_parents(client, seeded_project):
    personal_line = create_personal_line(client, seeded_project)
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
    plotting_line = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Plotting Line",
            "goal": "Prepare figures.",
            "line_type": "sub",
            "parent_line_id": personal_line["id"],
        },
    ).json()

    personal_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Plan split work",
            "content": "Prepared the split between experiment and plotting.",
        },
    ).json()
    experiment_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": experiment_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Experiment complete",
            "content": "Finished experiment branch work.",
        },
    ).json()
    plotting_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": plotting_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Figures complete",
            "content": "Finished plotting branch work.",
        },
    ).json()

    merge_response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Merge experiment and plotting",
            "content": "Integrated the split tracks.",
            "parent_node_ids": [
                personal_update["id"],
                experiment_update["id"],
                plotting_update["id"],
            ],
        },
    )
    assert merge_response.status_code == 201
    merge_payload = merge_response.json()
    assert merge_payload["node_kind"] == "merge"
    assert sorted(merge_payload["parent_node_ids"]) == sorted(
        [personal_update["id"], experiment_update["id"], plotting_update["id"]],
    )

    graph_response = client.get(f"/projects/{seeded_project['project_id']}/graph")
    graph_payload = graph_response.json()
    assert any(edge["child_node_id"] == merge_payload["id"] for edge in graph_payload["edges"])


def test_node_rejects_non_owner_and_missing_target_head_in_merge(client, seeded_project):
    personal_line = create_personal_line(client, seeded_project)
    response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_b_id"],
            "title": "Invalid update",
            "content": "Not the owner.",
        },
    )
    assert response.status_code == 400

    first_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "First update",
            "content": "Owned update.",
        },
    ).json()
    sub_line = client.post(
        "/lines",
        json={
            "project_id": seeded_project["project_id"],
            "owner_id": seeded_project["student_a_id"],
            "title": "Sub line",
            "goal": None,
            "line_type": "sub",
            "parent_line_id": personal_line["id"],
        },
    ).json()
    sub_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": sub_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Sub work",
            "content": "Done on sub line.",
        },
    ).json()

    response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Bad merge",
            "content": "Missing personal head parent.",
            "parent_node_ids": [sub_update["id"]],
        },
    )
    assert response.status_code == 201
    assert response.json()["node_kind"] == "update"

    second_sub_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": sub_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Another sub work",
            "content": "More sub work.",
        },
    ).json()
    second_personal_update = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Second personal update",
            "content": "Advanced personal line again.",
        },
    ).json()
    assert second_personal_update["line_id"] == personal_line["id"]
    response = client.post(
        "/nodes",
        json={
            "project_id": seeded_project["project_id"],
            "line_id": personal_line["id"],
            "author_id": seeded_project["student_a_id"],
            "title": "Invalid merge",
            "content": "Missing target head.",
            "parent_node_ids": [first_update["id"], second_sub_update["id"]],
        },
    )
    assert response.status_code == 400
