from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session, get_llm_service
from gfr_backend.schemas.updates import CreateUpdateRequest, UpdateResponse
from gfr_backend.services.llm import LLMService
from gfr_backend.services.updates import create_progress_update

router = APIRouter(prefix="/updates", tags=["updates"])


@router.post("", response_model=UpdateResponse, status_code=status.HTTP_201_CREATED)
def create_update_route(
    payload: CreateUpdateRequest,
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
) -> UpdateResponse:
    update = create_progress_update(
        db,
        llm_service,
        branch_id=payload.branch_id,
        author_id=payload.author_id,
        content=payload.content,
        blockers=payload.blockers,
        next_step=payload.next_step,
    )
    return UpdateResponse.model_validate(update)
