from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from gfr_backend.db.models.branch import ResearchBranch
from gfr_backend.db.models.update import ProgressUpdate
from gfr_backend.db.models.user import User
from gfr_backend.services.llm import LLMService


def create_progress_update(
    session: Session,
    llm_service: LLMService,
    *,
    branch_id: int,
    author_id: int,
    content: str,
    blockers: str | None,
    next_step: str | None,
) -> ProgressUpdate:
    branch = session.get(ResearchBranch, branch_id)
    if branch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {branch_id} was not found.",
        )

    author = session.get(User, author_id)
    if author is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {author_id} was not found.",
        )

    if branch.owner_id != author_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only the branch owner can submit progress updates.",
        )

    update = ProgressUpdate(
        branch_id=branch_id,
        author_id=author_id,
        content=content,
        blockers=blockers,
        next_step=next_step,
        ai_suggested_subbranches=[],
        ai_status="pending",
    )
    session.add(update)
    session.flush()

    recent_updates = list_recent_updates_for_branch(session, branch_id)
    branch_context = {
        "branch_id": branch.id,
        "project_id": branch.project_id,
        "title": branch.title,
        "goal": branch.goal,
        "status": branch.status,
    }

    errors: list[str] = []
    try:
        update.ai_summary = llm_service.summarize_progress(
            updates=[
                {
                    "content": item.content,
                    "blockers": item.blockers,
                    "next_step": item.next_step,
                }
                for item in recent_updates
            ],
            branch_context=branch_context,
        )
    except Exception as exc:
        errors.append(f"summary: {exc}")

    try:
        update.ai_suggested_subbranches = llm_service.suggest_subbranches(
            update_text=content,
            branch_context=branch_context,
        )
    except Exception as exc:
        errors.append(f"suggestions: {exc}")

    if errors:
        update.ai_status = "failed"
        update.ai_error = "; ".join(errors)
    else:
        update.ai_status = "completed"
        update.ai_error = None

    session.commit()
    session.refresh(update)
    return update


def list_recent_updates_for_branch(session: Session, branch_id: int) -> list[ProgressUpdate]:
    branch = session.get(ResearchBranch, branch_id)
    if branch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch {branch_id} was not found.",
        )

    statement = (
        select(ProgressUpdate)
        .where(ProgressUpdate.branch_id == branch_id)
        .order_by(ProgressUpdate.created_at.desc(), ProgressUpdate.id.desc())
    )
    return list(session.execute(statement).scalars().all())
