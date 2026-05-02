import os
from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from gfr_backend.api.dependencies import (
    get_db_session,
    get_llm_service,
    get_retriever_service,
)
from gfr_backend.db.base import Base
from gfr_backend.db.models import Team, User, UserRole
from gfr_backend.main import create_app
from gfr_backend.services.retriever import StubRetrieverService

TEST_DB_URL = "sqlite:///./test_step1.db"


class FakeLLMService:
    @property
    def name(self) -> str:
        return "fake-llm"

    def summarize_progress(
        self,
        *,
        updates: list[dict[str, str | None]],
        branch_context: dict[str, str | int | None],
    ) -> str:
        latest = updates[-1]
        return f"Summary for {branch_context['title']}: {latest['content']}"

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        branch_context: dict[str, str | int | None],
    ) -> list[str]:
        return [
            f"{branch_context['title']} - experiment follow-up",
            f"{branch_context['title']} - analysis follow-up",
        ]

    def build_pre_meeting_brief(
        self,
        *,
        project_context: dict[str, str | int | None],
        recent_updates: list[dict[str, str | int | None]],
    ) -> str:
        return f"Briefing for {project_context['title']}: {len(recent_updates)} updates"

    def summarize_meeting(
        self,
        *,
        raw_notes: str,
        project_context: dict[str, str | int | None],
    ) -> str:
        return f"Meeting summary for {project_context['title']}: {raw_notes}"

    def extract_meeting_tasks(
        self,
        *,
        meeting_summary: str,
        participants: list[dict[str, str | int | None]],
    ) -> list[dict[str, str | int | None]]:
        tasks: list[dict[str, str | int | None]] = []
        for participant in participants:
            if participant["branch_type"] != "personal":
                continue
            tasks.append(
                {
                    "assignee_id": participant["owner_id"],
                    "branch_id": participant["branch_id"],
                    "description": f"Task for {participant['title']}: {meeting_summary}",
                    "due_hint": "before next meeting",
                }
            )
        return tasks


class FakeRetrieverService(StubRetrieverService):
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

    def override_db_session() -> Generator[Session]:
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
def client(app: FastAPI) -> Generator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def raw_session(db_session_factory) -> Generator[Session]:
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
