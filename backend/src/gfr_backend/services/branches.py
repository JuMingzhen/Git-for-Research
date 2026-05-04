from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.branch import BranchType, ResearchBranch
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.user import User, UserRole


def create_branch(
    session: Session,
    *,
    project_id: int,
    parent_branch_ids: list[int],
    owner_id: int,
    title: str,
    goal: str | None,
    branch_type: BranchType,
) -> ResearchBranch:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )

    owner = session.get(User, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {owner_id} was not found.",
        )

    if branch_type == BranchType.main:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Main branches are created automatically with the project.",
        )

    validated_parent_ids = _validate_parent_branch_ids(parent_branch_ids)
    parent_branches = _get_parent_branches_or_404(session, validated_parent_ids)
    _validate_parent_projects(parent_branches, project_id)

    if branch_type == BranchType.personal:
        if owner.role != UserRole.student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal branches must be owned by student users.",
            )
        if len(parent_branches) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal branches must have exactly one parent branch.",
            )
        if parent_branches[0].branch_type != BranchType.main:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal branches must be created under the main branch.",
            )
    if branch_type == BranchType.sub:
        if any(parent.owner_id != owner_id for parent in parent_branches):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-branches must stay under a branch owned by the same user.",
            )
        if any(parent.branch_type == BranchType.main for parent in parent_branches):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-branches cannot be created directly under the main branch.",
            )

    branch = ResearchBranch(
        project_id=project_id,
        owner_id=owner_id,
        title=title,
        goal=goal,
        branch_type=branch_type,
    )
    branch.parent_branches = parent_branches
    session.add(branch)
    session.commit()

    return get_branch_or_404(session, branch.id)


def get_branch_or_404(session: Session, branch_id: int) -> ResearchBranch:
    statement = (
        select(ResearchBranch)
        .options(
            selectinload(ResearchBranch.parent_branches),
            selectinload(ResearchBranch.child_branches),
            selectinload(ResearchBranch.owner),
        )
        .where(ResearchBranch.id == branch_id)
    )
    branch = session.execute(statement).scalar_one_or_none()
    if branch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {branch_id} was not found.",
        )
    return branch


def _validate_parent_branch_ids(parent_branch_ids: list[int]) -> list[int]:
    if not parent_branch_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one parent branch is required.",
        )
    if len(parent_branch_ids) != len(set(parent_branch_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent branch ids must be unique.",
        )
    return parent_branch_ids


def _get_parent_branches_or_404(
    session: Session,
    parent_branch_ids: list[int],
) -> list[ResearchBranch]:
    statement = select(ResearchBranch).where(ResearchBranch.id.in_(parent_branch_ids))
    branch_map = {
        branch.id: branch for branch in session.execute(statement).scalars().all()
    }

    missing_ids = sorted(set(parent_branch_ids) - set(branch_map))
    if missing_ids:
        missing_id = missing_ids[0]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {missing_id} was not found.",
        )

    return [branch_map[parent_id] for parent_id in parent_branch_ids]


def _validate_parent_projects(
    parent_branches: list[ResearchBranch],
    project_id: int,
) -> None:
    if any(parent.project_id != project_id for parent in parent_branches):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent branches must belong to the same project.",
        )
