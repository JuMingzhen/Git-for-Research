"use client";

import { useMemo, useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { create_branch } from "@/lib/api/branches";
import type { BranchSummary } from "@/lib/types/api";

interface BranchDetailPanelProps {
  project_id: number;
  owner_id: number;
  branches: BranchSummary[];
  selected_branch: BranchSummary;
  active_branch_id: number;
  on_activate_branch: (branch_id: number) => void;
  on_branch_created: (branch: BranchSummary) => void;
}

export function BranchDetailPanel({
  project_id,
  owner_id,
  branches,
  selected_branch,
  active_branch_id,
  on_activate_branch,
  on_branch_created,
}: BranchDetailPanelProps) {
  const [sub_title, setSubTitle] = useState("");
  const [sub_goal, setSubGoal] = useState("");
  const [merge_title, setMergeTitle] = useState("");
  const [merge_goal, setMergeGoal] = useState("");
  const [merge_parent_ids, setMergeParentIds] = useState<number[]>([]);
  const [error_message, setErrorMessage] = useState<string | null>(null);
  const [success_message, setSuccessMessage] = useState<string | null>(null);
  const [is_pending, startTransition] = useTransition();

  const merge_candidates = useMemo(
    () =>
      branches
        .filter((branch) => branch.owner_id === owner_id)
        .sort((left, right) => left.id - right.id),
    [branches, owner_id],
  );

  function toggle_merge_parent(branch_id: number) {
    setMergeParentIds((current) =>
      current.includes(branch_id)
        ? current.filter((item) => item !== branch_id)
        : [...current, branch_id].sort((left, right) => left - right),
    );
  }

  function submit_sub_branch() {
    if (!sub_title.trim()) {
      setErrorMessage("Please name the new sub-branch.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const created = await create_branch({
          project_id,
          parent_branch_ids: [active_branch_id],
          owner_id,
          title: sub_title.trim(),
          goal: sub_goal.trim() ? sub_goal.trim() : null,
          branch_type: "sub",
        });
        on_branch_created(created);
        on_activate_branch(created.id);
        setSubTitle("");
        setSubGoal("");
        setSuccessMessage("Sub-branch created.");
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Sub-branch creation failed.");
        }
      }
    });
  }

  function submit_merge_branch() {
    if (!merge_title.trim()) {
      setErrorMessage("Please name the merge milestone.");
      return;
    }

    if (merge_parent_ids.length < 2) {
      setErrorMessage("Select at least two branches to merge.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const created = await create_branch({
          project_id,
          parent_branch_ids: merge_parent_ids,
          owner_id,
          title: merge_title.trim(),
          goal: merge_goal.trim() ? merge_goal.trim() : null,
          branch_type: "sub",
        });
        on_branch_created(created);
        on_activate_branch(created.id);
        setMergeTitle("");
        setMergeGoal("");
        setMergeParentIds([]);
        setSuccessMessage("Merge milestone created.");
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Merge milestone creation failed.");
        }
      }
    });
  }

  return (
    <SectionCard title="Branch Detail" eyebrow="Current Context">
      <div className="space-y-5">
        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {selected_branch.title}
              </h3>
              <p className="text-sm leading-6 muted-copy">
                {selected_branch.goal ?? "No goal written for this branch."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected_branch.id === active_branch_id ? (
                <StatusBadge label="current branch" tone="student" />
              ) : (
                <button
                  type="button"
                  onClick={() => on_activate_branch(selected_branch.id)}
                  className="rounded-full border border-border-subtle bg-white/72 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-border-strong hover:bg-white"
                >
                  Use as current
                </button>
              )}
              {selected_branch.parent_branch_ids.length > 1 ? (
                <StatusBadge label="merge node" tone="success" />
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
            <span className="glass-chip rounded-full px-2.5 py-1">
              node #{selected_branch.id}
            </span>
            {selected_branch.parent_branch_ids.length > 0 ? (
              <span className="glass-chip rounded-full px-2.5 py-1">
                parents {selected_branch.parent_branch_ids.join(", ")}
              </span>
            ) : null}
          </div>
        </div>

        {error_message ? (
          <ErrorState title="Branch action failed" description={error_message} />
        ) : null}
        {success_message ? (
          <div className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-4 text-sm leading-6 text-[var(--success)]">
            {success_message}
          </div>
        ) : null}

        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">Create sub-branch</h4>
            <StatusBadge label={`parent #${active_branch_id}`} tone="student" />
          </div>
          <input
            value={sub_title}
            onChange={(event) => setSubTitle(event.target.value)}
            placeholder="Sub-branch title"
            className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <textarea
            value={sub_goal}
            onChange={(event) => setSubGoal(event.target.value)}
            placeholder="Short goal"
            className="min-h-24 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <button
            type="button"
            onClick={submit_sub_branch}
            disabled={is_pending}
            className="rounded-full bg-[var(--student-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {is_pending ? "Saving..." : "Create sub-branch"}
          </button>
        </div>

        <div className="space-y-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-foreground">Create merge milestone</h4>
            <StatusBadge label={`${merge_parent_ids.length} selected`} tone="success" />
          </div>
          <div className="grid gap-2">
            {merge_candidates.map((branch) => (
              <label
                key={branch.id}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={merge_parent_ids.includes(branch.id)}
                  onChange={() => toggle_merge_parent(branch.id)}
                />
                <span className="font-medium text-foreground">{branch.title}</span>
              </label>
            ))}
          </div>
          <input
            value={merge_title}
            onChange={(event) => setMergeTitle(event.target.value)}
            placeholder="Merge node title"
            className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <textarea
            value={merge_goal}
            onChange={(event) => setMergeGoal(event.target.value)}
            placeholder="What does this merge milestone represent?"
            className="min-h-24 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/82 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--student-accent)]"
          />
          <button
            type="button"
            onClick={submit_merge_branch}
            disabled={is_pending}
            className="rounded-full bg-[var(--terracotta)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {is_pending ? "Saving..." : "Create merge milestone"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
