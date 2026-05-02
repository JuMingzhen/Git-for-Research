from typing import Protocol


class RetrieverService(Protocol):
    @property
    def name(self) -> str: ...


class StubRetrieverService:
    @property
    def name(self) -> str:
        return "stub-retriever"
