"use client";

import { useMemo, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { create_node } from "@/lib/api/nodes";
import type { LineResponse, ProgressNodeResponse } from "@/lib/types/api";
import { usePersistentState } from "@/lib/use-persistent-state";

type ComposerMode = "update" | "merge";

interface ComposerDraft {
  mode: ComposerMode;
  title: string;
  content: string;
  blockers: string;
  next_step: string;
  selected_merge_line_ids: number[];
}

interface UpdateComposerProps {
  project_id: number;
  current_line: LineResponse;
  student_lines: LineResponse[];
  author_id: number;
  display_name: string;
  on_node_created: (node: ProgressNodeResponse) => void;
}

export function UpdateComposer({
  project_id,
  current_line,
  student_lines,
  author_id,
  display_name,
  on_node_created,
}: UpdateComposerProps) {
  const draft = usePersistentState<ComposerDraft>(
    `gfr:update-composer:${project_id}:${author_id}:${current_line.id}`,
    {
      mode: "update",
      title: "",
      content: "",
      blockers: "",
      next_step: "",
      selected_merge_line_ids: [],
    },
  );
  const success_message = usePersistentState<string | null>(
    `gfr:update-composer:success:${project_id}:${author_id}:${current_line.id}`,
    null,
  );
  const error_message = usePersistentState<string | null>(
    `gfr:update-composer:error:${project_id}:${author_id}:${current_line.id}`,
    null,
  );
  const [is_pending, setIsPending] = useState(false);

  const mode = draft.value.mode;
  const title = draft.value.title;
  const content = draft.value.content;
  const blockers = draft.value.blockers;
  const next_step = draft.value.next_step;
  const selected_merge_line_ids = draft.value.selected_merge_line_ids;

  const merge_candidates = useMemo(
    () =>
      student_lines.filter(
        (line) =>
          line.id !== current_line.id &&
          line.head_node_id !== null &&
          line.status === "active",
      ),
    [current_line.id, student_lines],
  );

  function reset_form() {
    draft.clear();
  }

  function toggle_merge_line(line_id: number) {
    draft.setValue((current) => ({
      ...current,
      selected_merge_line_ids: current.selected_merge_line_ids.includes(line_id)
        ? current.selected_merge_line_ids.filter((candidate) => candidate !== line_id)
        : [...current.selected_merge_line_ids, line_id].sort((left, right) => left - right),
    }));
  }

  async function handle_submit() {
    if (!title.trim()) {
      error_message.setValue("Please write a short title before submitting.");
      return;
    }
    if (!content.trim()) {
      error_message.setValue("Please write the node content before submitting.");
      return;
    }
    const current_head_node_id = current_line.head_node_id;

    if (current_head_node_id === null) {
      error_message.setValue("The current line has no head node yet.");
      return;
    }
    if (mode === "merge" && selected_merge_line_ids.length === 0) {
      error_message.setValue("Select at least one source line for this merge update.");
      return;
    }

    error_message.clear();
    success_message.clear();
    setIsPending(true);

    try {
      const parent_node_ids =
        mode === "merge"
          ? Array.from(
              new Set([
                current_head_node_id,
                ...selected_merge_line_ids
                  .map((line_id) => student_lines.find((line) => line.id === line_id)?.head_node_id)
                  .filter((value): value is number => value !== null && value !== undefined),
              ]),
            )
          : undefined;

      if (mode === "merge" && (!parent_node_ids || parent_node_ids.length < 2)) {
        error_message.setValue("The selected lines do not yet point to distinct nodes to merge.");
        return;
      }

      const created = await create_node({
        project_id,
        line_id: current_line.id,
        author_id,
        title: title.trim(),
        content: content.trim(),
        blockers: blockers.trim() ? blockers.trim() : null,
        next_step: next_step.trim() ? next_step.trim() : null,
        parent_node_ids,
      });
      on_node_created(created);
      reset_form();
      success_message.setValue(
        mode === "merge"
          ? `${display_name}'s merge update was saved.`
          : `${display_name}'s update was saved.`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        error_message.setValue(error.message);
      } else {
        error_message.setValue("This update could not be submitted right now.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <SectionCard
      title="Submit Update"
      eyebrow="Current Line"
      description={current_line.title}
      action={<StatusBadge label={mode} tone={mode === "merge" ? "success" : "student"} />}
    >
      {error_message.value ? (
        <div className="mb-4">
          <ErrorState title="Update submission failed" description={error_message.value} />
        </div>
      ) : null}
      {success_message.value ? (
        <div className="mb-4 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-4 text-sm leading-6 text-[var(--success)]">
          {success_message.value}
        </div>
      ) : null}
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              draft.setValue((current) => ({
                ...current,
                mode: "update",
              }))
            }
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "update"
                ? "bg-[var(--student-accent)] text-white"
                : "border border-border-subtle bg-white/72 text-foreground hover:border-border-strong hover:bg-white",
            ].join(" ")}
          >
            Normal update
          </button>
          <button
            type="button"
            onClick={() =>
              draft.setValue((current) => ({
                ...current,
                mode: "merge",
              }))
            }
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "merge"
                ? "bg-[var(--terracotta)] text-white"
                : "border border-border-subtle bg-white/72 text-foreground hover:border-border-strong hover:bg-white",
            ].join(" ")}
          >
            Merge update
          </button>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 px-4 py-3 text-sm leading-6 muted-copy">
          Current line: <span className="font-semibold text-foreground">{current_line.title}</span>
          {current_line.head_node_id !== null ? (
            <span className="ml-2">/ head node #{current_line.head_node_id}</span>
          ) : null}
        </div>

        {mode === "merge" ? (
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Merge sources</h4>
              <StatusBadge label={`${selected_merge_line_ids.length} selected`} tone="success" />
            </div>
            <p className="mt-2 text-sm leading-6 muted-copy">
              The current line head is included automatically. Select the other student lines whose
              current heads should be merged into this update.
            </p>
            <div className="mt-4 grid gap-2">
              {merge_candidates.map((line) => (
                <label
                  key={line.id}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected_merge_line_ids.includes(line.id)}
                    onChange={() => toggle_merge_line(line.id)}
                  />
                  <span className="font-medium text-foreground">{line.title}</span>
                  <span className="text-[0.72rem] text-[var(--ink-muted)]">
                    head #{line.head_node_id}
                  </span>
                </label>
              ))}
              {merge_candidates.length === 0 ? (
                <p className="text-sm leading-6 muted-copy">
                  No other active student lines are available to merge yet.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="node-title" className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
            title
          </label>
          <input
            id="node-title"
            value={title}
            onChange={(event) =>
              draft.setValue((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder={mode === "merge" ? "Merged milestone title" : "Short node title"}
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--student-accent)]"
          />
        </div>

        <div>
          <label
            htmlFor="update-content"
            className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
          >
            content
          </label>
          <textarea
            id="update-content"
            value={content}
            onChange={(event) =>
              draft.setValue((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder={
              mode === "merge"
                ? "What does this merge node combine and conclude?"
                : "What did you actually finish, test, or decide?"
            }
            className="mt-2 min-h-36 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="update-blockers"
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              blocker
            </label>
            <textarea
              id="update-blockers"
              value={blockers}
              onChange={(event) =>
                draft.setValue((current) => ({
                  ...current,
                  blockers: event.target.value,
                }))
              }
              placeholder="What is slowing this line down?"
              className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="update-next-step"
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              next step
            </label>
            <textarea
              id="update-next-step"
              value={next_step}
              onChange={(event) =>
                draft.setValue((current) => ({
                  ...current,
                  next_step: event.target.value,
                }))
              }
              placeholder="What should happen next on this line?"
              className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handle_submit}
            disabled={is_pending}
            className={[
              "rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65",
              mode === "merge" ? "bg-[var(--terracotta)]" : "bg-[var(--student-accent)]",
            ].join(" ")}
          >
            {is_pending ? "Submitting..." : mode === "merge" ? "Submit merge update" : "Submit update"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
