from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from gfr_backend.db.models.meeting import Meeting
from gfr_backend.db.models.meeting_task import MeetingTask
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.update import ProgressUpdate
from gfr_backend.services.llm import LLMService


def create_meeting(
    session: Session,
    *,
    project_id: int,
    title: str,
    scheduled_at,
    raw_notes: str | None,
) -> Meeting:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )

    meeting = Meeting(
        project_id=project_id,
        title=title,
        scheduled_at=scheduled_at,
        raw_notes=raw_notes,
    )
    session.add(meeting)
    session.commit()
    return get_meeting_or_404(session, meeting.id)


def get_meeting_or_404(session: Session, meeting_id: int) -> Meeting:
    statement = (
        select(Meeting)
        .options(
            selectinload(Meeting.tasks).selectinload(MeetingTask.assignee),
            selectinload(Meeting.tasks).selectinload(MeetingTask.branch),
        )
        .where(Meeting.id == meeting_id)
    )
    meeting = session.execute(statement).scalar_one_or_none()
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting {meeting_id} was not found.",
        )
    return meeting


def list_project_meetings(session: Session, project_id: int) -> list[Meeting]:
    _get_project_with_branches(session, project_id)
    statement = (
        select(Meeting)
        .options(
            selectinload(Meeting.tasks).selectinload(MeetingTask.assignee),
            selectinload(Meeting.tasks).selectinload(MeetingTask.branch),
        )
        .where(Meeting.project_id == project_id)
        .order_by(Meeting.created_at.desc(), Meeting.id.desc())
    )
    return list(session.execute(statement).scalars().all())


def list_project_tasks(session: Session, project_id: int) -> list[MeetingTask]:
    _get_project_with_branches(session, project_id)
    statement = (
        select(MeetingTask)
        .join(MeetingTask.meeting)
        .options(
            selectinload(MeetingTask.assignee),
            selectinload(MeetingTask.branch),
            selectinload(MeetingTask.meeting),
        )
        .where(Meeting.project_id == project_id)
        .order_by(MeetingTask.created_at.desc(), MeetingTask.id.desc())
    )
    return list(session.execute(statement).scalars().all())


def update_meeting_task_status(
    session: Session,
    *,
    task_id: int,
    status_value: str,
) -> MeetingTask:
    task = get_meeting_task_or_404(session, task_id)
    cleaned_status = status_value.strip()
    if not cleaned_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task status must not be empty.",
        )

    task.status = cleaned_status
    session.commit()
    return get_meeting_task_or_404(session, task.id)


def get_meeting_task_or_404(session: Session, task_id: int) -> MeetingTask:
    statement = (
        select(MeetingTask)
        .options(
            selectinload(MeetingTask.assignee),
            selectinload(MeetingTask.branch),
            selectinload(MeetingTask.meeting),
        )
        .where(MeetingTask.id == task_id)
    )
    task = session.execute(statement).scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting task {task_id} was not found.",
        )
    return task


def build_meeting_briefing(
    session: Session,
    llm_service: LLMService,
    *,
    meeting_id: int,
) -> Meeting:
    meeting = get_meeting_or_404(session, meeting_id)
    project = _get_project_with_branches(session, meeting.project_id)
    recent_updates = _list_project_updates(session, meeting.project_id)
    project_context = {
        "project_id": project.id,
        "title": project.title,
        "description": project.description,
        "branch_count": len(project.branches),
    }

    try:
        meeting.ai_briefing = llm_service.build_pre_meeting_brief(
            project_context=project_context,
            recent_updates=[
                {
                    "branch_id": update.branch_id,
                    "author_id": update.author_id,
                    "content": update.content,
                    "blockers": update.blockers,
                    "next_step": update.next_step,
                }
                for update in recent_updates
            ],
        )
        meeting.briefing_status = "completed"
        meeting.briefing_error = None
    except Exception as exc:
        meeting.briefing_status = "failed"
        meeting.briefing_error = str(exc)

    session.commit()
    return get_meeting_or_404(session, meeting.id)


def summarize_meeting_notes(
    session: Session,
    llm_service: LLMService,
    *,
    meeting_id: int,
) -> Meeting:
    meeting = get_meeting_or_404(session, meeting_id)
    project = _get_project_with_branches(session, meeting.project_id)
    project_context = {
        "project_id": project.id,
        "title": project.title,
        "description": project.description,
    }

    try:
        meeting.ai_summary = llm_service.summarize_meeting(
            raw_notes=meeting.raw_notes or "",
            project_context=project_context,
        )
        meeting.summary_status = "completed"
        meeting.summary_error = None
    except Exception as exc:
        meeting.summary_status = "failed"
        meeting.summary_error = str(exc)

    session.commit()
    return get_meeting_or_404(session, meeting.id)


def split_meeting_tasks(
    session: Session,
    llm_service: LLMService,
    *,
    meeting_id: int,
) -> Meeting:
    meeting = get_meeting_or_404(session, meeting_id)
    project = _get_project_with_branches(session, meeting.project_id)
    participants = [
        {
            "branch_id": branch.id,
            "owner_id": branch.owner_id,
            "title": branch.title,
            "branch_type": branch.branch_type.value,
        }
        for branch in project.branches
    ]

    try:
        generated_tasks = llm_service.extract_meeting_tasks(
            meeting_summary=meeting.ai_summary or meeting.raw_notes or "",
            participants=participants,
        )
        _replace_meeting_tasks(
            session,
            meeting=meeting,
            project=project,
            generated_tasks=generated_tasks,
        )
        meeting.task_split_status = "completed"
        meeting.task_split_error = None
    except Exception as exc:
        meeting.task_split_status = "failed"
        meeting.task_split_error = str(exc)

    session.commit()
    return get_meeting_or_404(session, meeting.id)


def _replace_meeting_tasks(
    session: Session,
    *,
    meeting: Meeting,
    project: Project,
    generated_tasks: list[dict[str, str | int | None]],
) -> None:
    branch_map = {branch.id: branch for branch in project.branches}

    validated_tasks: list[MeetingTask] = []
    for generated in generated_tasks:
        branch_id = generated.get("branch_id")
        assignee_id = generated.get("assignee_id")
        description = generated.get("description")
        due_hint = generated.get("due_hint")

        if not isinstance(branch_id, int) or not isinstance(assignee_id, int):
            raise ValueError("Generated task is missing a valid branch_id or assignee_id.")
        if not isinstance(description, str) or not description.strip():
            raise ValueError("Generated task is missing a valid description.")

        branch = branch_map.get(branch_id)
        if branch is None:
            raise ValueError("Generated task branch does not belong to the meeting project.")
        if branch.owner_id != assignee_id:
            raise ValueError("Generated task assignee must match the target branch owner.")

        validated_tasks.append(
            MeetingTask(
                meeting_id=meeting.id,
                assignee_id=assignee_id,
                branch_id=branch_id,
                description=description,
                due_hint=due_hint if isinstance(due_hint, str) else None,
            )
        )

    session.execute(delete(MeetingTask).where(MeetingTask.meeting_id == meeting.id))
    for task in validated_tasks:
        session.add(task)


def _get_project_with_branches(session: Session, project_id: int) -> Project:
    statement = (
        select(Project)
        .options(selectinload(Project.branches))
        .where(Project.id == project_id)
    )
    project = session.execute(statement).scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )
    return project


def _list_project_updates(session: Session, project_id: int) -> list[ProgressUpdate]:
    statement = (
        select(ProgressUpdate)
        .join(ProgressUpdate.branch)
        .where(ProgressUpdate.branch.has(project_id=project_id))
        .order_by(ProgressUpdate.created_at.desc(), ProgressUpdate.id.desc())
    )
    return list(session.execute(statement).scalars().all())
