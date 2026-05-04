from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session, get_llm_service
from gfr_backend.schemas.meetings import (
    CreateMeetingRequest,
    MeetingResponse,
    MeetingTaskResponse,
    UpdateMeetingTaskStatusRequest,
)
from gfr_backend.services.llm import LLMService
from gfr_backend.services.meetings import (
    build_meeting_briefing,
    create_meeting,
    get_meeting_or_404,
    get_meeting_task_or_404,
    split_meeting_tasks,
    summarize_meeting_notes,
    update_meeting_task_status,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def build_meeting_task_response(task) -> MeetingTaskResponse:
    return MeetingTaskResponse(
        id=task.id,
        meeting_id=task.meeting_id,
        assignee_id=task.assignee_id,
        assignee_name=task.assignee.name,
        branch_id=task.branch_id,
        branch_title=task.branch.title,
        description=task.description,
        due_hint=task.due_hint,
        status=task.status,
        created_at=task.created_at,
    )


def build_meeting_response(meeting) -> MeetingResponse:
    ordered_tasks = sorted(meeting.tasks, key=lambda task: task.id)
    return MeetingResponse(
        id=meeting.id,
        project_id=meeting.project_id,
        title=meeting.title,
        scheduled_at=meeting.scheduled_at,
        raw_notes=meeting.raw_notes,
        ai_briefing=meeting.ai_briefing,
        briefing_status=meeting.briefing_status,
        briefing_error=meeting.briefing_error,
        ai_summary=meeting.ai_summary,
        summary_status=meeting.summary_status,
        summary_error=meeting.summary_error,
        task_split_status=meeting.task_split_status,
        task_split_error=meeting.task_split_error,
        created_at=meeting.created_at,
        tasks=[build_meeting_task_response(task) for task in ordered_tasks],
    )


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting_route(
    payload: CreateMeetingRequest,
    db: Session = Depends(get_db_session),
) -> MeetingResponse:
    meeting = create_meeting(
        db,
        project_id=payload.project_id,
        title=payload.title,
        scheduled_at=payload.scheduled_at,
        raw_notes=payload.raw_notes,
    )
    return build_meeting_response(meeting)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
) -> MeetingResponse:
    meeting = get_meeting_or_404(db, meeting_id)
    return build_meeting_response(meeting)


@router.post("/{meeting_id}/briefing", response_model=MeetingResponse)
def build_meeting_briefing_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = build_meeting_briefing(db, llm_service, meeting_id=meeting_id)
    return build_meeting_response(meeting)


@router.post("/{meeting_id}/summarize", response_model=MeetingResponse)
def summarize_meeting_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = summarize_meeting_notes(db, llm_service, meeting_id=meeting_id)
    return build_meeting_response(meeting)


@router.post("/{meeting_id}/split-tasks", response_model=MeetingResponse)
def split_meeting_tasks_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = split_meeting_tasks(db, llm_service, meeting_id=meeting_id)
    return build_meeting_response(meeting)


task_router = APIRouter(prefix="/meeting-tasks", tags=["meeting-tasks"])


@task_router.get("/{task_id}", response_model=MeetingTaskResponse)
def get_meeting_task_route(
    task_id: int,
    db: Session = Depends(get_db_session),
) -> MeetingTaskResponse:
    task = get_meeting_task_or_404(db, task_id)
    return build_meeting_task_response(task)


@task_router.patch("/{task_id}", response_model=MeetingTaskResponse)
def update_meeting_task_status_route(
    task_id: int,
    payload: UpdateMeetingTaskStatusRequest,
    db: Session = Depends(get_db_session),
) -> MeetingTaskResponse:
    task = update_meeting_task_status(db, task_id=task_id, status_value=payload.status)
    return build_meeting_task_response(task)
