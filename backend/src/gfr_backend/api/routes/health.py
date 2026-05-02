from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from gfr_backend.api.dependencies import (
    get_db_session,
    get_llm_service,
    get_retriever_service,
)
from gfr_backend.services.llm import LLMService
from gfr_backend.services.retriever import RetrieverService

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str


class ReadinessResponse(BaseModel):
    status: str
    database: str
    llm_service: str
    retriever_service: str


@router.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=ReadinessResponse)
def readiness_check(
    db: Session = Depends(get_db_session),
    llm_service: LLMService = Depends(get_llm_service),
    retriever_service: RetrieverService = Depends(get_retriever_service),
) -> ReadinessResponse:
    db.execute(text("SELECT 1"))
    return ReadinessResponse(
        status="ok",
        database="ok",
        llm_service=llm_service.name,
        retriever_service=retriever_service.name,
    )
