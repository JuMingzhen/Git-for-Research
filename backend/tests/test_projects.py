from gfr_backend.db.models.branch import BranchType


def test_create_project_auto_creates_main_branch(client, seeded_users) -> None:
    response = client.post(
        "/projects",
        json={
            "title": "Multimodal Research Assistant",
            "description": "Phase 1 MVP project.",
            "owner_id": seeded_users["advisor_id"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Multimodal Research Assistant"
    assert body["owner_id"] == seeded_users["advisor_id"]
    assert body["main_branch_id"] is not None
    assert len(body["branches"]) == 1
    assert body["branches"][0]["branch_type"] == BranchType.main.value
    assert body["branches"][0]["parent_branch_ids"] == []
    assert body["branches"][0]["owner_name"] == "Advisor A"


def test_get_project_returns_existing_branches(client, seeded_users) -> None:
    created = client.post(
        "/projects",
        json={
            "title": "Research OS",
            "description": None,
            "owner_id": seeded_users["advisor_id"],
        },
    ).json()

    response = client.get(f"/projects/{created['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["main_branch_id"] == created["main_branch_id"]
    assert len(body["branches"]) == 1


def test_create_project_requires_advisor_owner(client, seeded_users) -> None:
    response = client.post(
        "/projects",
        json={
            "title": "Invalid Project",
            "description": "Student should not own this project.",
            "owner_id": seeded_users["student_a_id"],
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Only advisor users can create projects."
