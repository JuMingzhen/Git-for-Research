from datetime import datetime

from pydantic import BaseModel

from gfr_backend.db.models.branch import BranchType


class BranchSummary(BaseModel):
    id: int
    project_id: int
    parent_branch_ids: list[int]
    owner_id: int
    owner_name: str
    title: str
    goal: str | None
    status: str
    branch_type: BranchType
    created_at: datetime

    model_config = {"from_attributes": True}


class BranchDetail(BranchSummary):
    child_branch_ids: list[int]


class CreateBranchRequest(BaseModel):
    project_id: int
    parent_branch_ids: list[int]
    owner_id: int
    title: str
    goal: str | None = None
    branch_type: BranchType
