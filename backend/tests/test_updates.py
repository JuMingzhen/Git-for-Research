from gfr_backend.db.models.branch import BranchType


def _create_project(client, advisor_id: int) -> dict:
    response = client.post(
        "/projects",
        json={
            "title": "Update Project",
            "description": "Used for progress update tests.",
            "owner_id": advisor_id,
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_personal_branch(client, project: dict, owner_id: int) -> dict:
    response = client.post(
        "/branches",
        json={
            "project_id": project["id"],
            "parent_branch_ids": [project["main_branch_id"]],
            "owner_id": owner_id,
            "title": "Student A Branch",
            "goal": "Build the data pipeline.",
            "branch_type": BranchType.personal.value,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_progress_update_returns_ai_fields(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    branch = _create_personal_branch(client, project, seeded_users["student_a_id"])

    response = client.post(
        "/updates",
        json={
            "branch_id": branch["id"],
            "author_id": seeded_users["student_a_id"],
            "content": "Finished the first retrieval prototype.",
            "blockers": "Need cleaner benchmark data.",
            "next_step": "Run ablation experiments.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["branch_id"] == branch["id"]
    assert body["ai_status"] == "completed"
    assert (
        body["ai_summary"]
        == "Summary for Student A Branch: Finished the first retrieval prototype."
    )
    assert body["ai_suggested_subbranches"] == [
        "Student A Branch - experiment follow-up",
        "Student A Branch - analysis follow-up",
    ]


def test_list_branch_updates_returns_newest_first(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    branch = _create_personal_branch(client, project, seeded_users["student_a_id"])

    first = client.post(
        "/updates",
        json={
            "branch_id": branch["id"],
            "author_id": seeded_users["student_a_id"],
            "content": "Collected baseline notes.",
            "blockers": None,
            "next_step": "Build prototype.",
        },
    ).json()
    second = client.post(
        "/updates",
        json={
            "branch_id": branch["id"],
            "author_id": seeded_users["student_a_id"],
            "content": "Built prototype.",
            "blockers": "Evaluation is still noisy.",
            "next_step": "Run controlled tests.",
        },
    ).json()

    response = client.get(f"/branches/{branch['id']}/updates")

    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body] == [second["id"], first["id"]]


def test_reject_update_from_non_owner(client, seeded_users) -> None:
    project = _create_project(client, seeded_users["advisor_id"])
    branch = _create_personal_branch(client, project, seeded_users["student_a_id"])

    response = client.post(
        "/updates",
        json={
            "branch_id": branch["id"],
            "author_id": seeded_users["student_b_id"],
            "content": "Trying to edit another branch.",
            "blockers": None,
            "next_step": None,
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["error"]["message"]
        == "Only the branch owner can submit progress updates."
    )


class BrokenLLMService:
    @property
    def name(self) -> str:
        return "broken-llm"

    def summarize_progress(
        self,
        *,
        updates: list[dict[str, str | None]],
        branch_context: dict[str, str | int | None],
    ) -> str:
        raise RuntimeError("summary unavailable")

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        branch_context: dict[str, str | int | None],
    ) -> list[str]:
        raise RuntimeError("suggestions unavailable")


def test_update_is_saved_even_if_ai_fails(app, client, seeded_users) -> None:
    from gfr_backend.api.dependencies import get_llm_service

    app.dependency_overrides[get_llm_service] = BrokenLLMService
    project = _create_project(client, seeded_users["advisor_id"])
    branch = _create_personal_branch(client, project, seeded_users["student_a_id"])

    response = client.post(
        "/updates",
        json={
            "branch_id": branch["id"],
            "author_id": seeded_users["student_a_id"],
            "content": "Saved without AI output.",
            "blockers": "",
            "next_step": "Try again later.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "Saved without AI output."
    assert body["ai_status"] == "failed"
    assert body["ai_summary"] is None
    assert body["ai_suggested_subbranches"] == []
    assert "summary unavailable" in body["ai_error"]

    list_response = client.get(f"/branches/{branch['id']}/updates")
    assert list_response.status_code == 200
    assert list_response.json()[0]["content"] == "Saved without AI output."
