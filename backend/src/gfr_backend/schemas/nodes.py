from datetime import datetime

from pydantic import BaseModel

from gfr_backend.schemas.lines import LineResponse


class CreateNodeRequest(BaseModel):
    project_id: int
    line_id: int
    author_id: int
    title: str
    content: str
    blockers: str | None = None
    next_step: str | None = None
    parent_node_ids: list[int] | None = None


class NodeResponse(BaseModel):
    id: int
    project_id: int
    line_id: int
    line_title: str
    author_id: int
    author_name: str
    title: str
    content: str
    blockers: str | None
    next_step: str | None
    node_kind: str
    parent_node_ids: list[int]
    ai_summary: str | None
    ai_suggested_subbranches: list[str]
    ai_status: str
    ai_error: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NodeEdgeResponse(BaseModel):
    parent_node_id: int
    child_node_id: int


class ProjectGraphResponse(BaseModel):
    project_id: int
    main_line_id: int
    lines: list[LineResponse]
    nodes: list[NodeResponse]
    edges: list[NodeEdgeResponse]

ProjectGraphResponse.model_rebuild()
