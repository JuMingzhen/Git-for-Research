from collections.abc import Generator

from sqlalchemy.orm import Session

from gfr_backend.db.session import SessionLocal
from gfr_backend.services.llm import LLMService, StubLLMService
from gfr_backend.services.retriever import RetrieverService, StubRetrieverService


def get_db_session() -> Generator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_llm_service() -> LLMService:
    return StubLLMService()


def get_retriever_service() -> RetrieverService:
    return StubRetrieverService()
