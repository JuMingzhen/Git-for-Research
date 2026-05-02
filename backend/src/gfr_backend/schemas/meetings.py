from datetime import datetime

from pydantic import BaseModel


class CreateMeetingRequest(BaseModel):
    project_id: int
    title: str
    scheduled_at: datetime | None = None
    raw_notes: str | None = None


class MeetingTaskResponse(BaseModel):
    id: int
    meeting_id: int
    assignee_id: int
    branch_id: int
    description: str
    due_hint: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingResponse(BaseModel):
    id: int
    project_id: int
    title: str
    scheduled_at: datetime | None
    raw_notes: str | None
    ai_briefing: str | None
    briefing_status: str
    briefing_error: str | None
    ai_summary: str | None
    summary_status: str
    summary_error: str | None
    task_split_status: str
    task_split_error: str | None
    created_at: datetime
    tasks: list[MeetingTaskResponse]

    model_config = {"from_attributes": True}
