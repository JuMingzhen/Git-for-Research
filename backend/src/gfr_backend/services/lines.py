from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.line import LineType, ResearchLine
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.user import User, UserRole


def create_line(
    session: Session,
    *,
    project_id: int,
    owner_id: int,
    title: str,
    goal: str | None,
    line_type: LineType,
    parent_line_id: int,
) -> ResearchLine:
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

    parent_line = get_line_or_404(session, parent_line_id)
    if parent_line.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent line must belong to the same project.",
        )
    if parent_line.head_node_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent line has no head node.",
        )
    if line_type == LineType.main:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Main lines are created automatically with the project.",
        )

    if line_type == LineType.personal:
        if owner.role != UserRole.student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal lines must be owned by student users.",
            )
        if project.main_line_id != parent_line_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal lines must be created from the project's main line.",
            )
    if line_type == LineType.sub:
        if parent_line.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-lines must be created from a line owned by the same user.",
            )
        if parent_line.line_type == LineType.main:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-lines cannot be created directly from the main line.",
            )

    line = ResearchLine(
        project_id=project_id,
        owner_id=owner_id,
        title=title,
        goal=goal,
        line_type=line_type,
        parent_line_id=parent_line.id,
        base_node_id=parent_line.head_node_id,
        head_node_id=parent_line.head_node_id,
    )
    session.add(line)
    session.commit()
    return get_line_or_404(session, line.id)


def get_line_or_404(session: Session, line_id: int) -> ResearchLine:
    statement = (
        select(ResearchLine)
        .options(
            selectinload(ResearchLine.owner),
            selectinload(ResearchLine.parent_line),
            selectinload(ResearchLine.base_node),
            selectinload(ResearchLine.head_node),
        )
        .where(ResearchLine.id == line_id)
    )
    line = session.execute(statement).scalar_one_or_none()
    if line is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Line {line_id} was not found.",
        )
    return line
