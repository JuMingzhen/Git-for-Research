from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session, get_llm_service
from gfr_backend.schemas.meetings import CreateMeetingRequest, MeetingResponse, MeetingTaskResponse
from gfr_backend.services.llm import LLMService
from gfr_backend.services.meetings import (
    build_meeting_briefing,
    create_meeting,
    get_meeting_or_404,
    split_meeting_tasks,
    summarize_meeting_notes,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _build_meeting_response(meeting) -> MeetingResponse:
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
        tasks=[MeetingTaskResponse.model_validate(task) for task in ordered_tasks],
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
    return _build_meeting_response(meeting)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
) -> MeetingResponse:
    meeting = get_meeting_or_404(db, meeting_id)
    return _build_meeting_response(meeting)


@router.post("/{meeting_id}/briefing", response_model=MeetingResponse)
def build_meeting_briefing_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = build_meeting_briefing(db, llm_service, meeting_id=meeting_id)
    return _build_meeting_response(meeting)


@router.post("/{meeting_id}/summarize", response_model=MeetingResponse)
def summarize_meeting_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = summarize_meeting_notes(db, llm_service, meeting_id=meeting_id)
    return _build_meeting_response(meeting)


@router.post("/{meeting_id}/split-tasks", response_model=MeetingResponse)
def split_meeting_tasks_route(
    meeting_id: int,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> MeetingResponse:
    meeting = split_meeting_tasks(db, llm_service, meeting_id=meeting_id)
    return _build_meeting_response(meeting)
