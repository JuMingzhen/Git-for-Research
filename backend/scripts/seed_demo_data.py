from __future__ import annotations

from datetime import datetime

from sqlalchemy import select

from gfr_backend.db.base import Base
from gfr_backend.db.models.team import Team
from gfr_backend.db.models.user import User, UserRole
from gfr_backend.db.session import SessionLocal, engine
from gfr_backend.services.lines import create_line
from gfr_backend.services.llm import StubLLMService
from gfr_backend.services.meetings import (
    build_meeting_briefing,
    create_meeting,
    get_meeting_or_404,
    split_meeting_tasks,
    summarize_meeting_notes,
)
from gfr_backend.services.nodes import create_progress_node
from gfr_backend.services.projects import create_project


def main() -> None:
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    llm_service = StubLLMService()

    try:
        existing_user = session.scalar(select(User.id).limit(1))
        if existing_user is not None:
            raise RuntimeError(
                "Refusing to seed demo data into a non-empty database. "
                "Start from a fresh local demo database if you want deterministic IDs."
            )

        team = Team(name="Demo Research Group")
        session.add(team)
        session.flush()

        advisor = User(name="Advisor A", role=UserRole.advisor, team_id=team.id)
        student_a = User(name="Student A", role=UserRole.student, team_id=team.id)
        student_b = User(name="Student B", role=UserRole.student, team_id=team.id)
        session.add_all([advisor, student_a, student_b])
        session.commit()

        project = create_project(
            session,
            title="Retrieval-Augmented Research Assistant",
            description="Demo project for the Git for Research line and node walkthrough.",
            owner_id=advisor.id,
        )

        student_a_line = create_line(
            session,
            project_id=project.id,
            owner_id=student_a.id,
            title="Student A Main Line",
            goal="Own retrieval experiments and milestone merges.",
            line_type="personal",
            parent_line_id=project.main_line_id,
        )
        student_b_line = create_line(
            session,
            project_id=project.id,
            owner_id=student_b.id,
            title="Student B Main Line",
            goal="Own evaluation cleanup and benchmark review.",
            line_type="personal",
            parent_line_id=project.main_line_id,
        )

        experiment_line = create_line(
            session,
            project_id=project.id,
            owner_id=student_a.id,
            title="Experiment Line",
            goal="Run retrieval ablations against the baseline.",
            line_type="sub",
            parent_line_id=student_a_line.id,
        )
        plotting_line = create_line(
            session,
            project_id=project.id,
            owner_id=student_a.id,
            title="Plotting Line",
            goal="Prepare comparison figures for the current study.",
            line_type="sub",
            parent_line_id=student_a_line.id,
        )
        cleanup_line = create_line(
            session,
            project_id=project.id,
            owner_id=student_b.id,
            title="Benchmark Cleanup Line",
            goal="Resolve noisy labels before the next group meeting.",
            line_type="sub",
            parent_line_id=student_b_line.id,
        )

        student_a_head = create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=student_a_line.id,
            author_id=student_a.id,
            title="Baseline ready",
            content="Finished the first retrieval baseline and wrote down the milestone summary.",
            blockers="Need cleaner benchmark slices for the final comparison.",
            next_step="Split experiments from figure preparation.",
        )
        experiment_head = create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=experiment_line.id,
            author_id=student_a.id,
            title="Ablation batch completed",
            content="Completed the first ablation batch and compared top-k retrieval variants.",
            blockers="Still need to double-check the hardest benchmark subset.",
            next_step="Merge conclusions back into the main line.",
        )
        plotting_head = create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=plotting_line.id,
            author_id=student_a.id,
            title="Comparison figures drafted",
            content="Prepared the comparison plots for the baseline and ablation runs.",
            blockers=None,
            next_step="Merge figures into the milestone note.",
        )
        create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=student_b_line.id,
            author_id=student_b.id,
            title="Evaluation sheet cleaned",
            content="Cleaned the evaluation sheet and removed duplicate benchmark rows.",
            blockers="Some labels still need manual review.",
            next_step="Finish the noisy-label pass.",
        )
        create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=cleanup_line.id,
            author_id=student_b.id,
            title="Noisy labels reviewed",
            content="Reviewed the remaining noisy labels and documented the unresolved samples.",
            blockers="Need advisor confirmation for two ambiguous examples.",
            next_step="Update the benchmark protocol note.",
        )

        create_progress_node(
            session,
            llm_service,
            project_id=project.id,
            line_id=student_a_line.id,
            author_id=student_a.id,
            title="Merge experiment and figures",
            content=(
                "Merged the experiment conclusions and comparison figures into "
                "one milestone update."
            ),
            blockers=None,
            next_step="Prepare the meeting walkthrough and remaining benchmark checks.",
            parent_node_ids=[student_a_head.id, experiment_head.id, plotting_head.id],
        )

        meeting = create_meeting(
            session,
            project_id=project.id,
            title="Weekly Research Meeting",
            scheduled_at=datetime.fromisoformat("2026-05-07T10:00:00"),
            raw_notes=(
                "Student A should polish the merged milestone note and verify the hardest "
                "benchmark subset. Student B should finish the noisy-label decision list "
                "and tighten the benchmark protocol before next week."
            ),
        )
        build_meeting_briefing(session, llm_service, meeting_id=meeting.id)
        summarize_meeting_notes(session, llm_service, meeting_id=meeting.id)
        split_meeting_tasks(session, llm_service, meeting_id=meeting.id)

        meeting = get_meeting_or_404(session, meeting.id)
        first_task = next(
            (task for task in meeting.tasks if task.assignee_id == student_a.id),
            None,
        )
        if first_task is not None:
            first_task.status = "in_progress"
            session.commit()

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    print("Demo data created.")
    print("Expected local walkthrough IDs:")
    print("  advisor_id=1")
    print("  student_a_id=2")
    print("  student_b_id=3")
    print("  project_id=1")
    print("  main_line_id=1")
    print("  student_a_line_id=2")
    print("  student_b_line_id=3")
    print("  experiment_line_id=4")
    print("  plotting_line_id=5")
    print("  cleanup_line_id=6")
    print("  meeting_task_count>=2")


if __name__ == "__main__":
    main()
