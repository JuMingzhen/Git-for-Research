import { StatusBadge } from "@/components/status-badge";
import type { ProjectResponse } from "@/lib/types/api";

interface ProjectHeroProps {
  project: ProjectResponse;
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const main_branch = project.branches.find(
    (branch) => branch.id === project.main_branch_id,
  );
  const student_branches = project.branches.filter(
    (branch) => branch.branch_type === "personal",
  );
  const milestone_branches = project.branches.filter(
    (branch) => branch.branch_type === "sub" && branch.parent_branch_ids.length > 1,
  );

  return (
    <section className="paper-panel rounded-[var(--radius-lg)] p-6 md:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">
                Project Hero
              </p>
              <h2 className="display-title text-4xl font-medium leading-tight text-foreground md:text-5xl">
                {project.title}
              </h2>
            </div>
            <StatusBadge label={project.status} tone="advisor" />
          </div>
          <p className="max-w-3xl text-base leading-7 rich-copy md:text-lg">
            {project.description ??
              "This project is currently running without a written description."}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                Main Branch
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {main_branch?.title ?? "Main Branch"}
              </p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                The common research spine that all student tracks eventually report back into.
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                Student Tracks
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {student_branches.length}
              </p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                Personal branches currently visible from the advisor vantage point.
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                Merge Milestones
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {milestone_branches.length}
              </p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                Multi-parent milestones where split work converges into one checkpoint.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(31,74,60,0.1),rgba(184,138,71,0.06))] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">
              Why This Matters
            </p>
            <StatusBadge label="War Room Lens" tone="warning" />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 rich-copy">
            <p>
              This page is designed to answer the advisor&apos;s real question quickly:
              what is the project doing right now, what just happened in meetings, and
              where should I probe next?
            </p>
            <p>
              Instead of reducing the project to a flat task list, the interface keeps
              the research structure visible: branches split, milestones merge, meeting
              outputs return as tasks, and history remains queryable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
