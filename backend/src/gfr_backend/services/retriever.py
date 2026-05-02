import re
from dataclasses import dataclass
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from gfr_backend.db.models.meeting import Meeting
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.update import ProgressUpdate

STOPWORDS = {
    "a",
    "about",
    "an",
    "and",
    "before",
    "did",
    "for",
    "is",
    "next",
    "or",
    "the",
    "to",
    "was",
    "what",
}


@dataclass
class RetrievedChunk:
    source_type: str
    source_id: int
    text: str
    score: int


class RetrieverService(Protocol):
    @property
    def name(self) -> str: ...

    def search_history(
        self,
        *,
        session: Session,
        project_id: int,
        question: str,
        limit: int = 3,
    ) -> list[RetrievedChunk]: ...


class StubRetrieverService:
    @property
    def name(self) -> str:
        return "stub-retriever"

    def search_history(
        self,
        *,
        session: Session,
        project_id: int,
        question: str,
        limit: int = 3,
    ) -> list[RetrievedChunk]:
        tokens = _tokenize(question)
        if not tokens:
            return []
        minimum_score = 1 if len(tokens) == 1 else 2

        chunks: list[RetrievedChunk] = []
        project = session.get(Project, project_id)
        if project is None:
            return []

        meeting_statement = select(Meeting).where(Meeting.project_id == project_id)
        for meeting in session.execute(meeting_statement).scalars():
            for candidate_text in [meeting.ai_summary, meeting.raw_notes, meeting.ai_briefing]:
                if not candidate_text:
                    continue
                score = _score_text(candidate_text, tokens)
                if score >= minimum_score:
                    chunks.append(
                        RetrievedChunk(
                            source_type="meeting",
                            source_id=meeting.id,
                            text=candidate_text,
                            score=score,
                        )
                    )

        update_statement = (
            select(ProgressUpdate)
            .join(ProgressUpdate.branch)
            .where(ProgressUpdate.branch.has(project_id=project_id))
        )
        for update in session.execute(update_statement).scalars():
            for candidate_text in [
                update.content,
                update.blockers,
                update.next_step,
                update.ai_summary,
            ]:
                if not candidate_text:
                    continue
                score = _score_text(candidate_text, tokens)
                if score >= minimum_score:
                    chunks.append(
                        RetrievedChunk(
                            source_type="progress_update",
                            source_id=update.id,
                            text=candidate_text,
                            score=score,
                        )
                    )

        chunks.sort(key=lambda chunk: (-chunk.score, chunk.source_type, chunk.source_id))
        return chunks[:limit]


def _tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"\w+", text.lower())
        if len(token) >= 2 and token not in STOPWORDS
    ]


def _score_text(text: str, tokens: list[str]) -> int:
    normalized = text.lower()
    return sum(1 for token in tokens if token in normalized)
