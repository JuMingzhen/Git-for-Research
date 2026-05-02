from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import get_db_session, get_retriever_service
from gfr_backend.schemas.qa import AskQuestionRequest, AskQuestionResponse
from gfr_backend.services.qa import answer_question_from_history
from gfr_backend.services.retriever import RetrieverService

router = APIRouter(prefix="/qa", tags=["qa"])


@router.post("/ask", response_model=AskQuestionResponse)
def ask_question_route(
    payload: AskQuestionRequest,
    db: Session = Depends(get_db_session),
    retriever_service: RetrieverService = Depends(get_retriever_service),
) -> AskQuestionResponse:
    return answer_question_from_history(
        db,
        retriever_service,
        project_id=payload.project_id,
        question=payload.question,
    )
