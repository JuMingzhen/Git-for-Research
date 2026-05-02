from typing import Protocol


class LLMService(Protocol):
    @property
    def name(self) -> str: ...


class StubLLMService:
    @property
    def name(self) -> str:
        return "stub-llm"
