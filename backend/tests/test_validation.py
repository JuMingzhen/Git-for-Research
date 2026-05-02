from fastapi import APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel


class DemoPayload(BaseModel):
    value: int


def test_validation_error_uses_consistent_shape(app) -> None:
    router = APIRouter()

    @router.post("/validation-demo")
    def validation_demo(payload: DemoPayload) -> dict[str, int]:
        return {"value": payload.value}

    app.include_router(router)
    with TestClient(app) as client:
        response = client.post("/validation-demo", json={"value": "not-an-int"})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["message"] == "Request validation failed."
    assert len(body["error"]["details"]) > 0
