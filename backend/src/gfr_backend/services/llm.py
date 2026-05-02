from typing import Protocol


class LLMService(Protocol):
    @property
    def name(self) -> str: ...

    def summarize_progress(
        self,
        *,
        updates: list[dict[str, str | None]],
        branch_context: dict[str, str | int | None],
    ) -> str: ...

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        branch_context: dict[str, str | int | None],
    ) -> list[str]: ...


class StubLLMService:
    @property
    def name(self) -> str:
        return "stub-llm"

    def summarize_progress(
        self,
        *,
        updates: list[dict[str, str | None]],
        branch_context: dict[str, str | int | None],
    ) -> str:
        latest = updates[-1] if updates else {}
        current_focus = latest.get("content") or "No progress provided."
        return f"Current focus: {current_focus}"

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        branch_context: dict[str, str | int | None],
    ) -> list[str]:
        if not update_text.strip():
            return []
        branch_title = branch_context.get("title") or "branch"
        return [f"{branch_title}: follow-up experiment", f"{branch_title}: analysis track"]
