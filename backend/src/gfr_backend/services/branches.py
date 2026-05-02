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
    parent_branch_id: int,
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

    parent_branch = session.get(ResearchBranch, parent_branch_id)
    if parent_branch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {parent_branch_id} was not found.",
        )
    if parent_branch.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent branch must belong to the same project.",
        )
    if branch_type == BranchType.main:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Main branches are created automatically with the project.",
        )

    if branch_type == BranchType.personal:
        if owner.role != UserRole.student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal branches must be owned by student users.",
            )
        if parent_branch.branch_type != BranchType.main:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal branches must be created under the main branch.",
            )
    if branch_type == BranchType.sub:
        if parent_branch.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-branches must stay under a branch owned by the same user.",
            )
        if parent_branch.branch_type == BranchType.main:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-branches cannot be created directly under the main branch.",
            )

    branch = ResearchBranch(
        project_id=project_id,
        parent_branch_id=parent_branch_id,
        owner_id=owner_id,
        title=title,
        goal=goal,
        branch_type=branch_type,
    )
    session.add(branch)
    session.commit()

    return get_branch_or_404(session, branch.id)


def get_branch_or_404(session: Session, branch_id: int) -> ResearchBranch:
    statement = (
        select(ResearchBranch)
        .options(selectinload(ResearchBranch.child_branches))
        .where(ResearchBranch.id == branch_id)
    )
    branch = session.execute(statement).scalar_one_or_none()
    if branch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {branch_id} was not found.",
        )
    return branch
