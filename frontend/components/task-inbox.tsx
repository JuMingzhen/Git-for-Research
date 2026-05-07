"use client";

import { useState, useTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { RefreshButton } from "@/components/refresh-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { update_meeting_task } from "@/lib/api/tasks";
import { format_short_date } from "@/lib/format";
import type { MeetingTaskResponse } from "@/lib/types/api";

interface TaskInboxProps {
  tasks: MeetingTaskResponse[];
  error_message?: string;
  on_task_updated: (task: MeetingTaskResponse) => void;
}

const TASK_STATUS_OPTIONS = ["todo", "in_progress", "done"] as const;

function task_tone(status: string) {
  if (status === "done") {
    return "success" as const;
  }

  if (status === "in_progress") {
    return "warning" as const;
  }

  return "student" as const;
}

export function TaskInbox({
  tasks,
  error_message,
  on_task_updated,
}: TaskInboxProps) {
  const [pending_task_id, setPendingTaskId] = useState<number | null>(null);
  const [inline_error, setInlineError] = useState<string | null>(null);
  const [is_pending, startTransition] = useTransition();

  function handle_status_change(task_id: number, next_status: string) {
    setInlineError(null);
    setPendingTaskId(task_id);

    startTransition(async () => {
      try {
        const updated = await update_meeting_task(task_id, { status: next_status });
        on_task_updated(updated);
      } catch (error) {
        if (error instanceof ApiError) {
          setInlineError(error.message);
        } else {
          setInlineError("Task status could not be updated right now.");
        }
      } finally {
        setPendingTaskId(null);
      }
    });
  }

  return (
    <SectionCard
      title="Task Inbox"
      eyebrow="Tasks"
      description="Tasks for this branch and student."
      action={<StatusBadge label={`${tasks.length} tasks`} tone="student" />}
    >
      {error_message ? (
        <ErrorState
          title="Task inbox unavailable"
          description={error_message}
          action={<RefreshButton label="Retry task fetch" tone="student" />}
        />
      ) : null}
      {!error_message && inline_error ? (
        <div className="mb-4">
          <ErrorState title="Task update failed" description={inline_error} />
        </div>
      ) : null}
      {!error_message && tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="New meeting tasks will appear here."
        />
      ) : null}
      {!error_message && tasks.length > 0 ? (
        <div className="grid gap-4">
          {tasks.map((task) => {
            const is_updating = is_pending && pending_task_id === task.id;

            return (
              <article
                key={task.id}
                className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                      {task.description}
                    </p>
                    <p className="text-sm leading-6 muted-copy">
                      {task.branch_title} / meeting #{task.meeting_id} / {format_short_date(task.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={task.status} tone={task_tone(task.status)} />
                    {task.due_hint ? (
                      <StatusBadge label={task.due_hint} tone="neutral" />
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={is_updating || option === task.status}
                      onClick={() => handle_status_change(task.id, option)}
                      className="rounded-full border border-border-subtle bg-white/72 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-border-strong hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {is_updating && pending_task_id === task.id && option === task.status
                        ? "Updating..."
                        : option}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </SectionCard>
  );
}
