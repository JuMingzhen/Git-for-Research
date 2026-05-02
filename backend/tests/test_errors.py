from fastapi.testclient import TestClient


def test_not_found_uses_consistent_shape(client) -> None:
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "http_error",
            "message": "Not Found",
            "details": [],
        }
    }


def test_unhandled_exception_uses_consistent_shape(error_app) -> None:
    with TestClient(error_app, raise_server_exceptions=False) as client:
        response = client.get("/boom")

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "internal_error",
            "message": "An unexpected error occurred.",
            "details": [],
        }
    }
