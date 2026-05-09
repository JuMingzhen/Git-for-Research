from sqlalchemy import text


def test_healthcheck_returns_ok(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_uses_test_dependencies(client) -> None:
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "llm_service": "fake-llm",
        "retriever_service": "fake-retriever",
    }


def test_test_database_session_is_usable(raw_session) -> None:
    value = raw_session.execute(text("SELECT 1")).scalar_one()

    assert value == 1


def test_cors_preflight_allows_frontend_origin(client) -> None:
    response = client.options(
        "/nodes",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
