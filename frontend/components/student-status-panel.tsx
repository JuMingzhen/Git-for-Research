import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { RefreshButton } from "@/components/refresh-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { BranchSummary, MeetingTaskResponse } from "@/lib/types/api";

interface StudentStatusPanelProps {
  branches: BranchSummary[];
  tasks: MeetingTaskResponse[];
  tasks_error_message?: string;
}

export function StudentStatusPanel({
  branches,
  tasks,
  tasks_error_message,
}: StudentStatusPanelProps) {
  const personal_branches = branches.filter((branch) => branch.branch_type === "personal");

  return (
    <SectionCard
      title="Student Track Snapshot"
      eyebrow="Advisor Summary"
      description="A conservative overview derived from branch topology and meeting-generated tasks, without inventing activity the backend does not currently expose."
    >
      {tasks_error_message ? (
        <div className="mb-4">
          <ErrorState
            title="Task-derived activity is unavailable"
            description={`${tasks_error_message} The branch cards below still render from project structure only.`}
            action={<RefreshButton label="Retry task fetch" tone="advisor" />}
          />
        </div>
      ) : null}
      {personal_branches.length === 0 ? (
        <EmptyState
          title="No student branches yet"
          description="Create personal branches under the main branch to populate the advisor overview."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {personal_branches.map((branch) => {
            const owned_sub_branches = branches.filter(
              (candidate) =>
                candidate.branch_type === "sub" && candidate.owner_id === branch.owner_id,
            );
            const branch_tasks = tasks.filter(
              (task) => task.branch_id === branch.id || task.assignee_id === branch.owner_id,
            );
            const open_tasks = branch_tasks.filter((task) => task.status !== "done");
            const merge_nodes = owned_sub_branches.filter(
              (candidate) => candidate.parent_branch_ids.length > 1,
            );

            return (
              <article
                key={branch.id}
                className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {branch.owner_name}
                    </h3>
                    <p className="text-sm leading-6 muted-copy">{branch.title}</p>
                  </div>
                  <StatusBadge
                    label={open_tasks.length > 0 ? "active task load" : "quiet lane"}
                    tone={open_tasks.length > 0 ? "warning" : "success"}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-sm)] bg-[var(--advisor-accent-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                      sub-branches
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {owned_sub_branches.length}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--brass-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                      open tasks
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {open_tasks.length}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                      merge nodes
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {merge_nodes.length}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 rich-copy">
                  {branch.goal ?? "No explicit student goal has been captured for this branch."}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
