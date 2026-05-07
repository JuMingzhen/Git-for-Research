from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session
from gfr_backend.api.routes.lines import build_line_response
from gfr_backend.api.routes.meetings import build_meeting_response, build_meeting_task_response
from gfr_backend.api.routes.nodes import build_graph_response
from gfr_backend.schemas.lines import LineResponse
from gfr_backend.schemas.meetings import MeetingResponse, MeetingTaskResponse
from gfr_backend.schemas.nodes import ProjectGraphResponse
from gfr_backend.schemas.projects import CreateProjectRequest, ProjectResponse
from gfr_backend.services.meetings import list_project_meetings, list_project_tasks
from gfr_backend.services.nodes import list_project_nodes
from gfr_backend.services.projects import (
    create_project,
    get_project_or_404,
    list_project_lines,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def build_project_response(project) -> ProjectResponse:
    ordered_lines = sorted(project.lines, key=lambda line: line.id)
    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        owner_id=project.owner_id,
        status=project.status,
        main_line_id=project.main_line_id,
        lines=[build_line_response(line) for line in ordered_lines],
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project_route(
    payload: CreateProjectRequest,
    db: Session = Depends(get_db_session),
) -> ProjectResponse:
    project = create_project(
        db,
        title=payload.title,
        description=payload.description,
        owner_id=payload.owner_id,
    )
    return build_project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> ProjectResponse:
    project = get_project_or_404(db, project_id)
    return build_project_response(project)


@router.get("/{project_id}/lines", response_model=list[LineResponse])
def list_project_lines_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> list[LineResponse]:
    lines = list_project_lines(db, project_id)
    return [build_line_response(line) for line in lines]


@router.get("/{project_id}/graph", response_model=ProjectGraphResponse)
def get_project_graph_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> ProjectGraphResponse:
    project = get_project_or_404(db, project_id)
    lines = list_project_lines(db, project_id)
    nodes = list_project_nodes(db, project_id)
    return build_graph_response(project, lines, nodes)


@router.get("/{project_id}/meetings", response_model=list[MeetingResponse])
def list_project_meetings_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> list[MeetingResponse]:
    meetings = list_project_meetings(db, project_id)
    return [build_meeting_response(meeting) for meeting in meetings]


@router.get("/{project_id}/tasks", response_model=list[MeetingTaskResponse])
def list_project_tasks_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> list[MeetingTaskResponse]:
    tasks = list_project_tasks(db, project_id)
    return [build_meeting_task_response(task) for task in tasks]
