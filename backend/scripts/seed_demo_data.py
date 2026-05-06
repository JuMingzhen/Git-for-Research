from __future__ import annotations

from datetime import datetime

from sqlalchemy import select

from gfr_backend.db.base import Base
from gfr_backend.db.models.branch import BranchType, ResearchBranch
from gfr_backend.db.models.meeting import Meeting
from gfr_backend.db.models.meeting_task import MeetingTask
from gfr_backend.db.models.project import Project
from gfr_backend.db.models.team import Team
from gfr_backend.db.models.update import ProgressUpdate
from gfr_backend.db.models.user import User, UserRole
from gfr_backend.db.session import SessionLocal, engine


def main() -> None:
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
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
        session.flush()

        project = Project(
            title="Retrieval-Augmented Research Assistant",
            description="Demo project for the Git for Research MVP walkthrough.",
            owner_id=advisor.id,
            status="active",
        )
        session.add(project)
        session.flush()

        main_branch = ResearchBranch(
            project_id=project.id,
            owner_id=advisor.id,
            title="Main Branch",
            goal="Shared research spine for retrieval-augmented assistant work.",
            status="active",
            branch_type=BranchType.main,
        )
        session.add(main_branch)
        session.flush()
        project.main_branch_id = main_branch.id
        session.flush()

        student_a_branch = ResearchBranch(
            project_id=project.id,
            owner_id=student_a.id,
            title="Student A Branch",
            goal="Own retrieval experiments and ablations.",
            status="active",
            branch_type=BranchType.personal,
            parent_branches=[main_branch],
        )
        student_b_branch = ResearchBranch(
            project_id=project.id,
            owner_id=student_b.id,
            title="Student B Branch",
            goal="Own evaluation workflow and dataset cleanup.",
            status="active",
            branch_type=BranchType.personal,
            parent_branches=[main_branch],
        )
        session.add_all([student_a_branch, student_b_branch])
        session.flush()

        student_a_experiment = ResearchBranch(
            project_id=project.id,
            owner_id=student_a.id,
            title="Student A Ablation Track",
            goal="Test retrieval variants against the current baseline.",
            status="active",
            branch_type=BranchType.sub,
            parent_branches=[student_a_branch],
        )
        student_a_plotting = ResearchBranch(
            project_id=project.id,
            owner_id=student_a.id,
            title="Student A Figure Track",
            goal="Prepare comparison plots for the retrieval study.",
            status="active",
            branch_type=BranchType.sub,
            parent_branches=[student_a_branch],
        )
        session.add_all([student_a_experiment, student_a_plotting])
        session.flush()

        student_a_merge = ResearchBranch(
            project_id=project.id,
            owner_id=student_a.id,
            title="Student A Milestone Merge",
            goal="Record the merged milestone after experiment and figure work reconverge.",
            status="active",
            branch_type=BranchType.sub,
            parent_branches=[student_a_branch, student_a_experiment, student_a_plotting],
        )
        student_b_cleanup = ResearchBranch(
            project_id=project.id,
            owner_id=student_b.id,
            title="Student B Benchmark Cleanup",
            goal="Resolve noisy labels and tighten the evaluation sheet.",
            status="active",
            branch_type=BranchType.sub,
            parent_branches=[student_b_branch],
        )
        session.add_all([student_a_merge, student_b_cleanup])
        session.flush()

        update_a = ProgressUpdate(
            branch_id=student_a_branch.id,
            author_id=student_a.id,
            content="Finished the first retrieval prototype and prepared ablation notes.",
            blockers="Need cleaner benchmark slices for the final comparison.",
            next_step="Run retrieval ablations and compare against the baseline.",
            ai_summary="Summary for Student A Branch: Finished the first retrieval prototype and prepared ablation notes.",
            ai_suggested_subbranches=[
                "Student A Branch - experiment follow-up",
                "Student A Branch - analysis follow-up",
            ],
            ai_status="completed",
        )
        update_b = ProgressUpdate(
            branch_id=student_b_branch.id,
            author_id=student_b.id,
            content="Cleaned the evaluation sheet and reviewed noisy samples.",
            blockers="Some labels still need manual review.",
            next_step="Tighten the benchmark set before the next meeting.",
            ai_summary="Summary for Student B Branch: Cleaned the evaluation sheet and reviewed noisy samples.",
            ai_suggested_subbranches=[],
            ai_status="failed",
            ai_error="Fake demo failure: evaluation summary timed out.",
        )
        session.add_all([update_a, update_b])
        session.flush()

        meeting = Meeting(
            project_id=project.id,
            title="Weekly Research Meeting",
            scheduled_at=datetime.fromisoformat("2026-05-03T10:00:00"),
            raw_notes=(
                "Student A should finish the retrieval ablation before next week. "
                "Student B should tighten the evaluation protocol and resolve the noisy labels."
            ),
            ai_briefing=(
                "Briefing for Retrieval-Augmented Research Assistant: "
                "Student A is blocked by benchmark slices; Student B is blocked by noisy labels."
            ),
            briefing_status="completed",
            ai_summary=(
                "Meeting summary: Student A will finish retrieval ablations and merge the figure work. "
                "Student B will tighten the benchmark protocol before the next check-in."
            ),
            summary_status="completed",
            task_split_status="completed",
        )
        session.add(meeting)
        session.flush()

        task_a = MeetingTask(
            meeting_id=meeting.id,
            assignee_id=student_a.id,
            branch_id=student_a_branch.id,
            description="Finish the retrieval ablation and merge the experiment and figure tracks.",
            due_hint="before next meeting",
            status="in_progress",
        )
        task_b = MeetingTask(
            meeting_id=meeting.id,
            assignee_id=student_b.id,
            branch_id=student_b_branch.id,
            description="Tighten the evaluation protocol and resolve the remaining noisy labels.",
            due_hint="before next meeting",
            status="todo",
        )
        session.add_all([task_a, task_b])
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
    print("  main_branch_id=1")
    print("  student_a_branch_id=2")
    print("  student_b_branch_id=3")
    print("  student_a_sub_branch_id=4")


if __name__ == "__main__":
    main()
