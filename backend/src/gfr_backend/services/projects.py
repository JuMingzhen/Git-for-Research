from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.branch import BranchType, ResearchBranch
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.user import User, UserRole


def create_project(
    session: Session,
    *,
    title: str,
    description: str | None,
    owner_id: int,
) -> Project:
    owner = session.get(User, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {owner_id} was not found.",
        )
    if owner.role != UserRole.advisor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only advisor users can create projects.",
        )

    project = Project(
        title=title,
        description=description,
        owner_id=owner_id,
    )
    session.add(project)
    session.flush()

    main_branch = ResearchBranch(
        project_id=project.id,
        owner_id=owner_id,
        title="Main Branch",
        goal=f"Primary research track for {title}",
        branch_type=BranchType.main,
    )
    session.add(main_branch)
    session.flush()

    project.main_branch_id = main_branch.id
    session.commit()

    return get_project_or_404(session, project.id)


def get_project_or_404(session: Session, project_id: int) -> Project:
    statement = (
        select(Project)
        .options(
            selectinload(Project.branches).selectinload(ResearchBranch.parent_branches),
        )
        .where(Project.id == project_id)
    )
    project = session.execute(statement).scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )
    return project
