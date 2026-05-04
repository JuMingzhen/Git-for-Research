from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session
from gfr_backend.schemas.branches import BranchDetail, CreateBranchRequest
from gfr_backend.schemas.updates import UpdateResponse
from gfr_backend.services.branches import create_branch, get_branch_or_404
from gfr_backend.services.updates import list_recent_updates_for_branch

router = APIRouter(prefix="/branches", tags=["branches"])


def _build_branch_response(branch) -> BranchDetail:
    return BranchDetail(
        id=branch.id,
        project_id=branch.project_id,
        parent_branch_ids=branch.parent_branch_ids,
        owner_id=branch.owner_id,
        title=branch.title,
        goal=branch.goal,
        status=branch.status,
        branch_type=branch.branch_type,
        created_at=branch.created_at,
        child_branch_ids=branch.child_branch_ids,
    )


@router.post("", response_model=BranchDetail, status_code=status.HTTP_201_CREATED)
def create_branch_route(
    payload: CreateBranchRequest,
    db: Session = Depends(get_db_session),
) -> BranchDetail:
    branch = create_branch(
        db,
        project_id=payload.project_id,
        parent_branch_ids=payload.parent_branch_ids,
        owner_id=payload.owner_id,
        title=payload.title,
        goal=payload.goal,
        branch_type=payload.branch_type,
    )
    return _build_branch_response(branch)


@router.get("/{branch_id}", response_model=BranchDetail)
def get_branch_route(
    branch_id: int,
    db: Session = Depends(get_db_session),
) -> BranchDetail:
    branch = get_branch_or_404(db, branch_id)
    return _build_branch_response(branch)


@router.get("/{branch_id}/updates", response_model=list[UpdateResponse])
def list_branch_updates_route(
    branch_id: int,
    db: Session = Depends(get_db_session),
) -> list[UpdateResponse]:
    updates = list_recent_updates_for_branch(db, branch_id)
    return [UpdateResponse.model_validate(update) for update in updates]
