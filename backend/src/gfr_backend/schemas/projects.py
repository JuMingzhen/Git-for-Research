from pydantic import BaseModel

from gfr_backend.schemas.lines import LineResponse


class CreateProjectRequest(BaseModel):
    title: str
    description: str | None = None
    owner_id: int


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str | None
    owner_id: int
    status: str
    main_line_id: int
    lines: list[LineResponse]
