import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { RefreshButton } from "@/components/refresh-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { LineResponse, MeetingTaskResponse, ProgressNodeResponse } from "@/lib/types/api";

interface StudentStatusPanelProps {
  lines: LineResponse[];
  nodes: ProgressNodeResponse[];
  tasks: MeetingTaskResponse[];
  tasks_error_message?: string;
}

export function StudentStatusPanel({
  lines,
  nodes,
  tasks,
  tasks_error_message,
}: StudentStatusPanelProps) {
  const personal_lines = lines.filter((line) => line.line_type === "personal");

  return (
    <SectionCard
      title="Student Snapshot"
      eyebrow="Advisor Summary"
      description="A compact summary of each student's working line, merge activity, and open meeting prompts."
    >
      {tasks_error_message ? (
        <div className="mb-4">
          <ErrorState
            title="Task-derived activity is unavailable"
            description={`${tasks_error_message} The student cards below still render from project graph structure.`}
            action={<RefreshButton label="Retry task fetch" tone="advisor" />}
          />
        </div>
      ) : null}
      {personal_lines.length === 0 ? (
        <EmptyState
          title="No student lines yet"
          description="Create personal lines under the main line to populate the advisor overview."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {personal_lines.map((line) => {
            const owned_lines = lines.filter((candidate) => candidate.owner_id === line.owner_id);
            const owned_nodes = nodes.filter((candidate) => owned_lines.some((item) => item.id === candidate.line_id));
            const merge_nodes = owned_nodes.filter((candidate) => candidate.node_kind === "merge");
            const student_tasks = tasks.filter((task) => task.assignee_id === line.owner_id);
            const open_tasks = student_tasks.filter((task) => task.status !== "done");
            const latest_node =
              [...owned_nodes].sort((left, right) => right.id - left.id)[0] ?? null;

            return (
              <article
                key={line.id}
                className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{line.owner_name}</h3>
                    <p className="text-sm leading-6 muted-copy">{line.title}</p>
                  </div>
                  <StatusBadge
                    label={open_tasks.length > 0 ? "open prompts" : "quiet lane"}
                    tone={open_tasks.length > 0 ? "warning" : "success"}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-sm)] bg-[var(--advisor-accent-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">lines</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{owned_lines.length}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--brass-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">open tasks</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{open_tasks.length}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] p-3">
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">merge nodes</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{merge_nodes.length}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 rich-copy">
                  {line.goal ?? "No explicit goal has been captured for this student's main line."}
                </p>
                <p className="mt-3 text-sm leading-6 muted-copy">
                  Latest node: {latest_node?.title ?? "No node recorded yet."}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
