from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.line import LineType, ResearchLine
from gfr_backend.db.models.node import NodeKind, ProgressNode
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

    project = Project(title=title, description=description, owner_id=owner_id)
    session.add(project)
    session.flush()

    main_line = ResearchLine(
        project_id=project.id,
        owner_id=owner_id,
        title="Main Line",
        goal=f"Primary research track for {title}",
        line_type=LineType.main,
    )
    session.add(main_line)
    session.flush()

    root_node = ProgressNode(
        project_id=project.id,
        line_id=main_line.id,
        author_id=owner_id,
        title="Project initialized",
        content=f"Project {title} initialized.",
        blockers=None,
        next_step=None,
        node_kind=NodeKind.initial,
        ai_suggested_subbranches=[],
        ai_status="completed",
        ai_summary="Initial project node created.",
        ai_error=None,
    )
    session.add(root_node)
    session.flush()

    main_line.base_node_id = root_node.id
    main_line.head_node_id = root_node.id
    project.main_line_id = main_line.id

    session.commit()
    return get_project_or_404(session, project.id)


def get_project_or_404(session: Session, project_id: int) -> Project:
    statement = (
        select(Project)
        .options(
            selectinload(Project.lines).selectinload(ResearchLine.owner),
            selectinload(Project.lines).selectinload(ResearchLine.parent_line),
            selectinload(Project.main_line),
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


def list_project_lines(session: Session, project_id: int) -> list[ResearchLine]:
    project = get_project_or_404(session, project_id)
    return sorted(project.lines, key=lambda line: line.id)
