from pydantic import BaseModel


class AskQuestionRequest(BaseModel):
    project_id: int
    question: str


class CitationResponse(BaseModel):
    source_type: str
    source_id: int
    snippet: str


class AskQuestionResponse(BaseModel):
    answer: str
    status: str
    citations: list[CitationResponse]
