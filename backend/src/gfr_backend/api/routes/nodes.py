from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session, get_llm_service
from gfr_backend.db.models.node import NodeKind
from gfr_backend.schemas.nodes import (
    CreateNodeRequest,
    NodeEdgeResponse,
    NodeResponse,
    ProjectGraphResponse,
)
from gfr_backend.services.llm import LLMService
from gfr_backend.services.nodes import create_progress_node, get_node_or_404, list_line_nodes

router = APIRouter(tags=["nodes"])


def build_node_response(node) -> NodeResponse:
    node_kind = (
        node.node_kind.value if isinstance(node.node_kind, NodeKind) else str(node.node_kind)
    )
    return NodeResponse(
        id=node.id,
        project_id=node.project_id,
        line_id=node.line_id,
        line_title=node.line.title,
        author_id=node.author_id,
        author_name=node.author.name,
        title=node.title,
        content=node.content,
        blockers=node.blockers,
        next_step=node.next_step,
        node_kind=node_kind,
        parent_node_ids=node.parent_node_ids,
        ai_summary=node.ai_summary,
        ai_suggested_subbranches=node.ai_suggested_subbranches,
        ai_status=node.ai_status,
        ai_error=node.ai_error,
        created_at=node.created_at,
    )


def build_graph_response(project, lines, nodes) -> ProjectGraphResponse:
    edges = [
        NodeEdgeResponse(parent_node_id=parent_id, child_node_id=node.id)
        for node in nodes
        for parent_id in node.parent_node_ids
    ]
    edges.sort(key=lambda edge: (edge.parent_node_id, edge.child_node_id))
    from gfr_backend.api.routes.lines import build_line_response

    return ProjectGraphResponse(
        project_id=project.id,
        main_line_id=project.main_line_id,
        lines=[build_line_response(line) for line in lines],
        nodes=[build_node_response(node) for node in nodes],
        edges=edges,
    )


@router.post("/nodes", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_node_route(
    payload: CreateNodeRequest,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> NodeResponse:
    node = create_progress_node(
        db,
        llm_service,
        project_id=payload.project_id,
        line_id=payload.line_id,
        author_id=payload.author_id,
        title=payload.title,
        content=payload.content,
        blockers=payload.blockers,
        next_step=payload.next_step,
        parent_node_ids=payload.parent_node_ids,
    )
    return build_node_response(node)


@router.get("/nodes/{node_id}", response_model=NodeResponse)
def get_node_route(
    node_id: int,
    db: Session = Depends(get_db_session),
) -> NodeResponse:
    node = get_node_or_404(db, node_id)
    return build_node_response(node)


@router.get("/lines/{line_id}/nodes", response_model=list[NodeResponse])
def list_line_nodes_route(
    line_id: int,
    db: Session = Depends(get_db_session),
) -> list[NodeResponse]:
    nodes = list_line_nodes(db, line_id)
    return [build_node_response(node) for node in nodes]
