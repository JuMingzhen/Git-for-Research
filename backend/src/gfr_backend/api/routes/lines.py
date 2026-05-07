from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session
from gfr_backend.db.models.line import LineType
from gfr_backend.schemas.lines import CreateLineRequest, LineResponse
from gfr_backend.services.lines import create_line, get_line_or_404

router = APIRouter(prefix="/lines", tags=["lines"])


def build_line_response(line) -> LineResponse:
    line_type = (
        line.line_type.value if isinstance(line.line_type, LineType) else str(line.line_type)
    )
    return LineResponse(
        id=line.id,
        project_id=line.project_id,
        owner_id=line.owner_id,
        owner_name=line.owner.name,
        title=line.title,
        goal=line.goal,
        line_type=line_type,
        parent_line_id=line.parent_line_id,
        base_node_id=line.base_node_id,
        head_node_id=line.head_node_id,
        status=line.status,
        created_at=line.created_at,
    )


@router.post("", response_model=LineResponse, status_code=status.HTTP_201_CREATED)
def create_line_route(
    payload: CreateLineRequest,
    db: Session = Depends(get_db_session),
) -> LineResponse:
    line = create_line(
        db,
        project_id=payload.project_id,
        owner_id=payload.owner_id,
        title=payload.title,
        goal=payload.goal,
        line_type=LineType(payload.line_type),
        parent_line_id=payload.parent_line_id,
    )
    return build_line_response(line)


@router.get("/{line_id}", response_model=LineResponse)
def get_line_route(
    line_id: int,
    db: Session = Depends(get_db_session),
) -> LineResponse:
    line = get_line_or_404(db, line_id)
    return build_line_response(line)
