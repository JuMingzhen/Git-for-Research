import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { RefreshButton } from "@/components/refresh-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { format_short_date } from "@/lib/format";
import type { MeetingTaskResponse } from "@/lib/types/api";

interface TaskRefluxPanelProps {
  tasks: MeetingTaskResponse[];
  error_message?: string;
}

function task_tone(status: string) {
  if (status === "done") {
    return "success" as const;
  }

  if (status === "in_progress") {
    return "warning" as const;
  }

  return "advisor" as const;
}

export function TaskRefluxPanel({ tasks, error_message }: TaskRefluxPanelProps) {
  return (
    <SectionCard
      title="Task Prompts"
      eyebrow="Meeting Output"
      description="Generic task prompts extracted from meetings and kept visible in the side workflow."
      action={<StatusBadge label={`${tasks.length} tasks`} tone="advisor" />}
    >
      {error_message ? (
        <ErrorState
          title="Task prompts unavailable"
          description={error_message}
          action={<RefreshButton label="Retry task fetch" tone="advisor" />}
        />
      ) : null}
      {!error_message && tasks.length === 0 ? (
        <EmptyState
          title="No task prompts yet"
          description="Once meeting task splitting succeeds, this panel becomes the quick post-meeting checklist."
        />
      ) : null}
      {!error_message && tasks.length > 0 ? (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{task.assignee_name}</p>
                  <p className="text-sm leading-6 muted-copy">
                    meeting #{task.meeting_id} / {format_short_date(task.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={task.status} tone={task_tone(task.status)} />
                  {task.due_hint ? <StatusBadge label={task.due_hint} tone="neutral" /> : null}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 rich-copy">{task.description}</p>
            </article>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
