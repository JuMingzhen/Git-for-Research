from datetime import datetime

from pydantic import BaseModel


class CreateLineRequest(BaseModel):
    project_id: int
    owner_id: int
    title: str
    goal: str | None = None
    line_type: str
    parent_line_id: int


class LineResponse(BaseModel):
    id: int
    project_id: int
    owner_id: int
    owner_name: str
    title: str
    goal: str | None
    line_type: str
    parent_line_id: int | None
    base_node_id: int | None
    head_node_id: int | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
