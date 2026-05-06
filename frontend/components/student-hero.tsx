import { StatusBadge } from "@/components/status-badge";
import type { BranchSummary, MeetingTaskResponse, UpdateResponse } from "@/lib/types/api";

interface StudentHeroProps {
  display_name: string;
  branch: BranchSummary;
  tasks: MeetingTaskResponse[];
  updates: UpdateResponse[];
}

export function StudentHero({
  display_name,
  branch,
  tasks,
  updates,
}: StudentHeroProps) {
  const latest_update = updates[0] ?? null;
  const open_tasks = tasks.filter((task) => task.status !== "done");

  return (
    <section className="paper-panel rounded-[var(--radius-lg)] p-6 md:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">
                Student Hero
              </p>
              <h2 className="display-title text-4xl font-medium leading-tight text-foreground md:text-5xl">
                {display_name}
              </h2>
            </div>
            <StatusBadge label={branch.status} tone="student" />
          </div>
          <div className="space-y-3">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
              Current personal branch
            </p>
            <h3 className="text-2xl font-semibold text-foreground">{branch.title}</h3>
            <p className="max-w-3xl text-base leading-7 rich-copy md:text-lg">
              {branch.goal ?? "No current branch goal has been written yet."}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
              Open tasks
            </p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {open_tasks.length}
            </p>
            <p className="mt-2 text-sm leading-6 muted-copy">
              Meeting tasks still waiting for progress on this branch.
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
              Latest blocker
            </p>
            <p className="mt-3 text-sm leading-6 rich-copy">
              {latest_update?.blockers ?? "No blocker recorded in the latest visible update."}
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
              Next step
            </p>
            <p className="mt-3 text-sm leading-6 rich-copy">
              {latest_update?.next_step ?? "No explicit next step has been captured yet."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
