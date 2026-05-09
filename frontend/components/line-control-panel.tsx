"use client";

import { useMemo, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { create_line } from "@/lib/api/lines";
import { format_long_date } from "@/lib/format";
import type { LineResponse, ProgressNodeResponse } from "@/lib/types/api";
import { usePersistentState } from "@/lib/use-persistent-state";

interface LineControlPanelProps {
  project_id: number;
  owner_id: number;
  lines: LineResponse[];
  current_line: LineResponse;
  selected_node: ProgressNodeResponse | null;
  on_activate_line: (line_id: number) => void;
  on_line_created: (line: LineResponse) => void;
}

export function LineControlPanel({
  project_id,
  owner_id,
  lines,
  current_line,
  selected_node,
  on_activate_line,
  on_line_created,
}: LineControlPanelProps) {
  const draft = usePersistentState(
    `gfr:line-control:${project_id}:${owner_id}:${current_line.id}`,
    {
      title: "",
      goal: "",
    },
  );
  const error_message = usePersistentState<string | null>(
    `gfr:line-control:error:${project_id}:${owner_id}:${current_line.id}`,
    null,
  );
  const success_message = usePersistentState<string | null>(
    `gfr:line-control:success:${project_id}:${owner_id}:${current_line.id}`,
    null,
  );
  const [is_pending, setIsPending] = useState(false);

  const ordered_lines = useMemo(
    () => [...lines].sort((left, right) => left.id - right.id),
    [lines],
  );

  async function handle_create_sub_line() {
    if (!title.trim()) {
      error_message.setValue("Please name the new line before creating it.");
      return;
    }

    error_message.clear();
    success_message.clear();
    setIsPending(true);

    try {
      const created = await create_line({
        project_id,
        owner_id,
        title: title.trim(),
        goal: goal.trim() ? goal.trim() : null,
        line_type: "sub",
        parent_line_id: current_line.id,
      });
      on_line_created(created);
      draft.clear();
      success_message.setValue("Sub-line created.");
    } catch (error) {
      if (error instanceof ApiError) {
        error_message.setValue(error.message);
        return;
      }

      error_message.setValue("The new line could not be created right now.");
    } finally {
      setIsPending(false);
    }
  }

  const title = draft.value.title;
  const goal = draft.value.goal;

  return (
    <SectionCard
      title="Current Work"
      eyebrow="Line Control"
      description="Keep one line active, inspect the selected node, and split out a new sub-line when needed."
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                Current line
              </p>
              <h3 className="text-xl font-semibold text-foreground">{current_line.title}</h3>
              <p className="text-sm leading-6 muted-copy">
                {current_line.goal ?? "No goal recorded for this line yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={current_line.line_type} tone="student" />
              <StatusBadge label={current_line.status} tone="neutral" />
            </div>
          </div>
        </div>

        {selected_node ? (
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                  Selected node
                </p>
                <h3 className="text-lg font-semibold text-foreground">{selected_node.title}</h3>
                <p className="text-sm leading-6 muted-copy">
                  {format_long_date(selected_node.created_at)} / {selected_node.line_title}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={selected_node.node_kind} tone="success" />
                <StatusBadge
                  label={selected_node.ai_status}
                  tone={selected_node.ai_status === "completed" ? "success" : "warning"}
                />
              </div>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6">
              <div>
                <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">content</p>
                <p className="mt-2 rich-copy">{selected_node.content}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[var(--radius-sm)] bg-[var(--blocker-soft)] px-4 py-4">
                  <p className="mono-caption text-[0.64rem] text-[var(--blocker)]">blocker</p>
                  <p className="mt-2 text-[var(--blocker)]">
                    {selected_node.blockers ?? "No blocker recorded."}
                  </p>
                </div>
                <div className="rounded-[var(--radius-sm)] bg-[var(--student-accent-soft)] px-4 py-4">
                  <p className="mono-caption text-[0.64rem] text-[var(--student-accent)]">
                    next step
                  </p>
                  <p className="mt-2 text-[var(--student-accent)]">
                    {selected_node.next_step ?? "No next step recorded."}
                  </p>
                </div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 p-4">
                <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">ai summary</p>
                <p className="mt-3 rich-copy">
                  {selected_node.ai_summary ??
                    selected_node.ai_error ??
                    "No AI summary is available for this node yet."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">Switch active line</h4>
            <StatusBadge label={`${ordered_lines.length} lines`} tone="student" />
          </div>
          <div className="grid gap-2">
            {ordered_lines.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => on_activate_line(line.id)}
                className={[
                  "flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-3 text-left text-sm transition",
                  line.id === current_line.id
                    ? "border-transparent bg-[var(--student-accent-soft)] text-[var(--student-accent)]"
                    : "border-border-subtle bg-white/72 text-foreground hover:border-border-strong hover:bg-white",
                ].join(" ")}
              >
                <span className="font-medium">{line.title}</span>
                <span className="text-[0.74rem] uppercase tracking-[0.14em]">
                  {line.line_type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error_message.value ? (
          <ErrorState title="Line action failed" description={error_message.value} />
        ) : null}
        {success_message.value ? (
          <div className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-4 text-sm leading-6 text-[var(--success)]">
            {success_message.value}
          </div>
        ) : null}

        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">Create sub-line</h4>
            <StatusBadge label={`from #${current_line.id}`} tone="student" />
          </div>
          <input
            value={title}
            onChange={(event) =>
              draft.setValue((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Sub-line title"
            className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <textarea
            value={goal}
            onChange={(event) =>
              draft.setValue((current) => ({
                ...current,
                goal: event.target.value,
              }))
            }
            placeholder="Short goal for this new line"
            className="min-h-24 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <button
            type="button"
            onClick={handle_create_sub_line}
            disabled={is_pending}
            className="rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {is_pending ? "Saving..." : "Create sub-line"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
