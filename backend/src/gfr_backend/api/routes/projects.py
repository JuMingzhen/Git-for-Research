from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session
from gfr_backend.api.routes.meetings import build_meeting_response, build_meeting_task_response
from gfr_backend.schemas.branches import BranchSummary
from gfr_backend.schemas.meetings import MeetingResponse, MeetingTaskResponse
from gfr_backend.schemas.projects import CreateProjectRequest, ProjectResponse
from gfr_backend.services.meetings import list_project_meetings, list_project_tasks
from gfr_backend.services.projects import create_project, get_project_or_404

router = APIRouter(prefix="/projects", tags=["projects"])


def _build_project_response(project) -> ProjectResponse:
    ordered_branches = sorted(project.branches, key=lambda branch: branch.id)
    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        owner_id=project.owner_id,
        status=project.status,
        main_branch_id=project.main_branch_id,
        branches=[
            BranchSummary(
                id=branch.id,
                project_id=branch.project_id,
                parent_branch_ids=branch.parent_branch_ids,
                owner_id=branch.owner_id,
                owner_name=branch.owner.name,
                title=branch.title,
                goal=branch.goal,
                status=branch.status,
                branch_type=branch.branch_type,
                created_at=branch.created_at,
            )
            for branch in ordered_branches
        ],
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
    return _build_project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_route(
    project_id: int,
    db: Session = Depends(get_db_session),
) -> ProjectResponse:
    project = get_project_or_404(db, project_id)
    return _build_project_response(project)


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
