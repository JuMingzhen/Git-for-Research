from datetime import datetime

from pydantic import BaseModel


class CreateUpdateRequest(BaseModel):
    branch_id: int
    author_id: int
    content: str
    blockers: str | None = None
    next_step: str | None = None


class UpdateResponse(BaseModel):
    id: int
    branch_id: int
    author_id: int
    content: str
    blockers: str | None
    next_step: str | None
    ai_summary: str | None
    ai_suggested_subbranches: list[str]
    ai_status: str
    ai_error: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
