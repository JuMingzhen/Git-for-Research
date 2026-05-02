import os
from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from gfr_backend.api.dependencies import (
    get_db_session,
    get_llm_service,
    get_retriever_service,
)
from gfr_backend.db.base import Base
from gfr_backend.db.models import Team, User, UserRole
from gfr_backend.main import create_app

TEST_DB_URL = "sqlite:///./test_step1.db"


class FakeLLMService:
    @property
    def name(self) -> str:
        return "fake-llm"


class FakeRetrieverService:
    @property
    def name(self) -> str:
        return "fake-retriever"


@pytest.fixture()
def test_engine():
    engine = create_engine(
        TEST_DB_URL,
        future=True,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("test_step1.db"):
        os.remove("test_step1.db")


@pytest.fixture()
def db_session_factory(test_engine):
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False, class_=Session)


@pytest.fixture()
def app(db_session_factory) -> FastAPI:
    app = create_app()

    def override_db_session() -> Generator[Session, None, None]:
        session = db_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_llm_service] = FakeLLMService
    app.dependency_overrides[get_retriever_service] = FakeRetrieverService
    return app


@pytest.fixture()
def client(app: FastAPI) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def raw_session(db_session_factory) -> Generator[Session, None, None]:
    session = db_session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def error_app() -> FastAPI:
    app = create_app()

    @app.get("/boom")
    def boom() -> None:
        raise RuntimeError("boom")

    return app


@pytest.fixture()
def seeded_users(raw_session: Session) -> dict[str, int]:
    team = Team(name="Research Team")
    raw_session.add(team)
    raw_session.flush()

    advisor = User(name="Advisor A", role=UserRole.advisor, team_id=team.id)
    student_a = User(name="Student A", role=UserRole.student, team_id=team.id)
    student_b = User(name="Student B", role=UserRole.student, team_id=team.id)
    raw_session.add_all([advisor, student_a, student_b])
    raw_session.commit()

    return {
        "team_id": team.id,
        "advisor_id": advisor.id,
        "student_a_id": student_a.id,
        "student_b_id": student_b.id,
    }
