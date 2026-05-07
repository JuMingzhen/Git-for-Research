from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.line import ResearchLine
from gfr_backend.db.models.node import NodeKind, ProgressNode
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.user import User
from gfr_backend.services.llm import LLMService


def create_progress_node(
    session: Session,
    llm_service: LLMService,
    *,
    project_id: int,
    line_id: int,
    author_id: int,
    title: str,
    content: str,
    blockers: str | None,
    next_step: str | None,
    parent_node_ids: list[int] | None = None,
) -> ProgressNode:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )

    line = get_line_for_node_or_404(session, line_id)
    if line.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Line must belong to the target project.",
        )

    author = session.get(User, author_id)
    if author is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {author_id} was not found.",
        )
    if line.owner_id != author_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only the line owner can submit progress updates.",
        )

    resolved_parent_ids = _resolve_parent_node_ids(line, parent_node_ids)
    parent_nodes = _get_parent_nodes_or_404(session, resolved_parent_ids)
    _validate_parent_project(parent_nodes, project_id)

    if len(parent_nodes) > 1 and line.head_node_id not in resolved_parent_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merge updates must include the target line's current head node.",
        )

    node = ProgressNode(
        project_id=project_id,
        line_id=line_id,
        author_id=author_id,
        title=title,
        content=content,
        blockers=blockers,
        next_step=next_step,
        node_kind=NodeKind.merge if len(parent_nodes) > 1 else NodeKind.update,
        ai_suggested_subbranches=[],
        ai_status="pending",
    )
    node.parent_nodes = parent_nodes
    session.add(node)
    session.flush()

    recent_nodes = list_line_nodes(session, line_id)
    line_context = {
        "line_id": line.id,
        "project_id": line.project_id,
        "title": line.title,
        "goal": line.goal,
        "status": line.status,
    }

    errors: list[str] = []
    try:
        node.ai_summary = llm_service.summarize_progress(
            nodes=[
                {
                    "title": item.title,
                    "content": item.content,
                    "blockers": item.blockers,
                    "next_step": item.next_step,
                }
                for item in recent_nodes
            ],
            line_context=line_context,
        )
    except Exception as exc:
        errors.append(f"summary: {exc}")

    try:
        node.ai_suggested_subbranches = llm_service.suggest_subbranches(
            update_text=content,
            line_context=line_context,
        )
    except Exception as exc:
        errors.append(f"suggestions: {exc}")

    if errors:
        node.ai_status = "failed"
        node.ai_error = "; ".join(errors)
    else:
        node.ai_status = "completed"
        node.ai_error = None

    line.head_node_id = node.id
    session.commit()
    return get_node_or_404(session, node.id)


def get_node_or_404(session: Session, node_id: int) -> ProgressNode:
    statement = (
        select(ProgressNode)
        .options(
            selectinload(ProgressNode.line),
            selectinload(ProgressNode.author),
            selectinload(ProgressNode.parent_nodes),
        )
        .where(ProgressNode.id == node_id)
    )
    node = session.execute(statement).scalar_one_or_none()
    if node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {node_id} was not found.",
        )
    return node


def list_line_nodes(session: Session, line_id: int) -> list[ProgressNode]:
    _ = get_line_for_node_or_404(session, line_id)
    statement = (
        select(ProgressNode)
        .where(ProgressNode.line_id == line_id)
        .order_by(ProgressNode.created_at.desc(), ProgressNode.id.desc())
    )
    return list(session.execute(statement).scalars().all())


def list_project_nodes(session: Session, project_id: int) -> list[ProgressNode]:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )
    statement = (
        select(ProgressNode)
        .options(
            selectinload(ProgressNode.line),
            selectinload(ProgressNode.author),
            selectinload(ProgressNode.parent_nodes),
        )
        .where(ProgressNode.project_id == project_id)
        .order_by(ProgressNode.id.asc())
    )
    return list(session.execute(statement).scalars().all())


def get_line_for_node_or_404(session: Session, line_id: int) -> ResearchLine:
    statement = select(ResearchLine).where(ResearchLine.id == line_id)
    line = session.execute(statement).scalar_one_or_none()
    if line is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Line {line_id} was not found.",
        )
    return line


def _resolve_parent_node_ids(
    line: ResearchLine,
    parent_node_ids: list[int] | None,
) -> list[int]:
    if parent_node_ids is None:
        if line.head_node_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The line has no current head node.",
            )
        return [line.head_node_id]
    if not parent_node_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one parent node is required.",
        )
    if len(parent_node_ids) != len(set(parent_node_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent node ids must be unique.",
        )
    return parent_node_ids


def _get_parent_nodes_or_404(
    session: Session,
    parent_node_ids: list[int],
) -> list[ProgressNode]:
    statement = select(ProgressNode).where(ProgressNode.id.in_(parent_node_ids))
    node_map = {node.id: node for node in session.execute(statement).scalars().all()}

    missing_ids = sorted(set(parent_node_ids) - set(node_map))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {missing_ids[0]} was not found.",
        )

    return [node_map[parent_id] for parent_id in parent_node_ids]


def _validate_parent_project(parent_nodes: list[ProgressNode], project_id: int) -> None:
    if any(node.project_id != project_id for node in parent_nodes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent nodes must belong to the same project.",
        )
