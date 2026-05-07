from typing import Protocol


class LLMService(Protocol):
    @property
    def name(self) -> str: ...

    def summarize_progress(
        self,
        *,
        nodes: list[dict[str, str | None]],
        line_context: dict[str, str | int | None],
    ) -> str: ...

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        line_context: dict[str, str | int | None],
    ) -> list[str]: ...

    def build_pre_meeting_brief(
        self,
        *,
        project_context: dict[str, str | int | None],
        recent_nodes: list[dict[str, str | int | None]],
    ) -> str: ...

    def summarize_meeting(
        self,
        *,
        raw_notes: str,
        project_context: dict[str, str | int | None],
    ) -> str: ...

    def extract_meeting_tasks(
        self,
        *,
        meeting_summary: str,
        participants: list[dict[str, str | int | None]],
    ) -> list[dict[str, str | int | None]]: ...


class StubLLMService:
    @property
    def name(self) -> str:
        return "stub-llm"

    def summarize_progress(
        self,
        *,
        nodes: list[dict[str, str | None]],
        line_context: dict[str, str | int | None],
    ) -> str:
        latest = nodes[0] if nodes else {}
        current_focus = latest.get("content") or "No progress provided."
        return f"Current focus: {current_focus}"

    def suggest_subbranches(
        self,
        *,
        update_text: str,
        line_context: dict[str, str | int | None],
    ) -> list[str]:
        if not update_text.strip():
            return []
        line_title = line_context.get("title") or "line"
        return [f"{line_title}: follow-up experiment", f"{line_title}: analysis track"]

    def build_pre_meeting_brief(
        self,
        *,
        project_context: dict[str, str | int | None],
        recent_nodes: list[dict[str, str | int | None]],
    ) -> str:
        project_title = project_context.get("title") or "project"
        update_count = len(recent_nodes)
        return f"Briefing for {project_title}: {update_count} recent updates reviewed."

    def summarize_meeting(
        self,
        *,
        raw_notes: str,
        project_context: dict[str, str | int | None],
    ) -> str:
        project_title = project_context.get("title") or "project"
        return f"Meeting summary for {project_title}: {raw_notes}"

    def extract_meeting_tasks(
        self,
        *,
        meeting_summary: str,
        participants: list[dict[str, str | int | None]],
    ) -> list[dict[str, str | int | None]]:
        tasks: list[dict[str, str | int | None]] = []
        for participant in participants:
            if participant.get("role") != "student":
                continue
            tasks.append(
                {
                    "assignee_id": participant["user_id"],
                    "description": f"Follow up on: {meeting_summary}",
                    "due_hint": "next meeting",
                }
            )
        return tasks
