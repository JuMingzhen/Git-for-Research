from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from gfr_backend.db.models.project import Project
from gfr_backend.schemas.qa import AskQuestionResponse, CitationResponse
from gfr_backend.services.retriever import RetrieverService

INSUFFICIENT_INFORMATION_ANSWER = "Insufficient information in project history."


def answer_question_from_history(
    session: Session,
    retriever_service: RetrieverService,
    *,
    project_id: int,
    question: str,
) -> AskQuestionResponse:
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} was not found.",
        )

    hits = retriever_service.search_history(
        session=session,
        project_id=project_id,
        question=question,
    )
    if not hits:
        return AskQuestionResponse(
            answer=INSUFFICIENT_INFORMATION_ANSWER,
            status="insufficient_information",
            citations=[],
        )

    citations = [
        CitationResponse(
            source_type=hit.source_type,
            source_id=hit.source_id,
            snippet=_make_snippet(hit.text),
        )
        for hit in hits
    ]
    answer = _build_answer_from_citations(citations)
    return AskQuestionResponse(
        answer=answer,
        status="answered",
        citations=citations,
    )


def _build_answer_from_citations(citations: list[CitationResponse]) -> str:
    lead = citations[0].snippet
    if len(citations) == 1:
        return f"Based on project history: {lead}"

    supporting = " | ".join(citation.snippet for citation in citations[1:])
    return f"Based on project history: {lead} Supporting context: {supporting}"


def _make_snippet(text: str, limit: int = 220) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3]}..."
