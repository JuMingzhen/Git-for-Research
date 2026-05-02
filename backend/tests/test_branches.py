from gfr_backend.db.models.branch import BranchType


def _create_project(client, advisor_id: int) -> dict:
    response = client.post(
        "/projects",
        json={
            "title": "Core Project",
            "description": "Used for branch tests.",
            "owner_id": advisor_id,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_personal_branch_under_main_branch(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])

    response = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_id": project["main_branch_id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Student A Branch",
            "goal": "Own the data pipeline direction.",
            "branch_type": BranchType.personal.value,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["parent_branch_id"] == project["main_branch_id"]
    assert body["owner_id"] == seeded_users["student_a_id"]
    assert body["branch_type"] == BranchType.personal.value


def test_create_sub_branch_and_read_parent_children(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    personal = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_id": project["main_branch_id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Student A Branch",
            "goal": "Own the data pipeline direction.",
            "branch_type": BranchType.personal.value,
        },
    ).json()

    sub_branch = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_id": personal["id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Ablation Study",
            "goal": "Compare retrieval strategies.",
            "branch_type": BranchType.sub.value,
        },
    )

    assert sub_branch.status_code == 201
    sub_body = sub_branch.json()
    assert sub_body["branch_type"] == BranchType.sub.value

    parent_response = client.get(f"/branches/{personal['id']}")
    assert parent_response.status_code == 200
    assert sub_body["id"] in parent_response.json()["child_branch_ids"]


def test_reject_cross_project_parent_branch(client, seeded_users) -> None:
    project_a = _create_project(client, seeded_users["advisor_id"])
    project_b = client.post(
        "/projects",
        json={
            "title": "Second Project",
            "description": None,
            "owner_id": seeded_users["advisor_id"],
        },
    ).json()

    response = client.post(
        "/branches",
        json={
            "project_id": project_b["id"],
            "parent_branch_id": project_a["main_branch_id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Invalid Personal Branch",
            "goal": None,
            "branch_type": BranchType.personal.value,
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Parent branch must belong to the same project."


def test_reject_sub_branch_owned_by_other_user(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    personal = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_id": project["main_branch_id"],
            "owner_id": seeded_users["student_a_id"],
            "title": "Student A Branch",
            "goal": None,
            "branch_type": BranchType.personal.value,
        },
    ).json()

    response = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_id": personal["id"],
            "owner_id": seeded_users["student_b_id"],
            "title": "Invalid Sub Branch",
            "goal": None,
            "branch_type": BranchType.sub.value,
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["error"]["message"]
        == "Sub-branches must stay under a branch owned by the same user."
    )
