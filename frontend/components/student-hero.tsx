import { StatusBadge } from "@/components/status-badge";
import type { LineResponse, MeetingTaskResponse, ProgressNodeResponse } from "@/lib/types/api";

interface StudentHeroProps {
  display_name: string;
  current_line: LineResponse;
  current_head_node: ProgressNodeResponse | null;
  selected_node: ProgressNodeResponse | null;
  tasks: MeetingTaskResponse[];
}

export function StudentHero({
  display_name,
  current_line,
  current_head_node,
  selected_node,
  tasks,
}: StudentHeroProps) {
  const open_tasks = tasks.filter((task) => task.status !== "done");

  return (
    <section className="paper-panel rounded-[var(--radius-lg)] p-6 md:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">Student</p>
              <h2 className="display-title text-4xl font-medium leading-tight text-foreground md:text-5xl">
                {display_name}
              </h2>
            </div>
            <StatusBadge label={current_line.status} tone="student" />
          </div>
          <div className="space-y-3">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Current line</p>
            <h3 className="text-2xl font-semibold text-foreground">{current_line.title}</h3>
            <p className="max-w-3xl text-base leading-7 rich-copy md:text-lg">
              {current_line.goal ?? "No goal yet."}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Open tasks</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{open_tasks.length}</p>
            <p className="mt-2 text-sm leading-6 muted-copy">Tasks still open.</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Current head</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
              {current_head_node?.title ?? "No head node yet."}
            </p>
            <p className="mt-2 text-sm leading-6 muted-copy">
              {current_head_node?.next_step ?? "No next step recorded."}
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4">
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Selected node</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
              {selected_node?.title ?? "Select a node to inspect it."}
            </p>
            <p className="mt-2 text-sm leading-6 muted-copy">
              {selected_node?.blockers ?? "No blocker recorded on this node."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
