import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { truncate_text } from "@/lib/format";
import type { BranchSummary } from "@/lib/types/api";

interface PersonalDagBoardProps {
  root_branch_id: number;
  branches: BranchSummary[];
  selected_branch_id: number;
  active_branch_id: number;
  on_select_branch: (branch_id: number) => void;
}

export function PersonalDagBoard({
  root_branch_id,
  branches,
  selected_branch_id,
  active_branch_id,
  on_select_branch,
}: PersonalDagBoardProps) {
  if (branches.length === 0) {
    return (
      <SectionCard title="Branch Graph" eyebrow="Notebook">
        <p className="text-sm leading-6 muted-copy">
          No branch structure is available yet.
        </p>
      </SectionCard>
    );
  }

  const sorted_branches = [...branches].sort((left, right) => left.id - right.id);
  const branch_map = new Map(sorted_branches.map((branch) => [branch.id, branch]));
  const depth_map = new Map<number, number>();

  function get_depth(branch_id: number): number {
    const cached = depth_map.get(branch_id);
    if (cached !== undefined) {
      return cached;
    }

    if (branch_id === root_branch_id) {
      depth_map.set(branch_id, 0);
      return 0;
    }

    const branch = branch_map.get(branch_id);
    if (!branch) {
      return 0;
    }

    const local_parents = branch.parent_branch_ids.filter((parent_id) => branch_map.has(parent_id));
    const depth =
      local_parents.length === 0
        ? 1
        : Math.max(...local_parents.map((parent_id) => get_depth(parent_id))) + 1;

    depth_map.set(branch_id, depth);
    return depth;
  }

  return (
    <SectionCard
      title="Branch Graph"
      eyebrow="Notebook"
      action={<StatusBadge label={`${branches.length} nodes`} tone="student" />}
    >
      <div className="space-y-2">
        {sorted_branches.map((branch, index) => {
          const depth = get_depth(branch.id);
          const is_selected = branch.id === selected_branch_id;
          const is_active = branch.id === active_branch_id;
          const is_root = branch.id === root_branch_id;
          const is_merge = branch.parent_branch_ids.length > 1;

          const dot_color = is_merge
            ? "var(--terracotta)"
            : branch.branch_type === "personal"
              ? "var(--student-accent)"
              : "var(--brass)";
          const dot_style = is_selected
            ? { boxShadow: `0 0 0 4px rgba(45, 79, 132, 0.14)` }
            : undefined;

          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => on_select_branch(branch.id)}
              className={[
                "group flex w-full items-start gap-4 rounded-[var(--radius-sm)] px-3 py-3 text-left transition",
                is_selected
                  ? "bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]"
                  : "hover:bg-white/50",
              ].join(" ")}
              style={{ paddingLeft: `${0.85 + depth * 1.2}rem` }}
            >
              <div className="relative flex min-h-8 flex-col items-center pt-1">
                {index < sorted_branches.length - 1 ? (
                  <span
                    className="absolute left-1/2 top-4 h-[calc(100%+1.25rem)] w-px -translate-x-1/2"
                    style={{ backgroundColor: "rgba(77, 71, 58, 0.16)" }}
                  />
                ) : null}
                <span
                  className={[
                    "relative z-10 block h-4 w-4 rounded-full border-2 bg-[var(--surface-strong)]",
                    is_merge ? "ring-2 ring-[var(--terracotta-soft)]" : "",
                  ].join(" ")}
                  style={{
                    borderColor: dot_color,
                    backgroundColor: is_root ? dot_color : "var(--surface-strong)",
                    ...dot_style,
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground md:text-base">
                    {branch.title}
                  </h3>
                  {is_active ? <StatusBadge label="current" tone="student" /> : null}
                  {is_merge ? <StatusBadge label="merge" tone="success" /> : null}
                  {is_root ? <StatusBadge label="trunk" tone="student" /> : null}
                </div>
                <p className="text-sm leading-6 muted-copy">
                  {truncate_text(
                    branch.goal ?? "No goal written for this branch.",
                    82,
                  )}
                </p>
                <div className="flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
                  <span className="glass-chip rounded-full px-2.5 py-1">
                    #{branch.id}
                  </span>
                  {branch.parent_branch_ids.length > 0 ? (
                    <span className="glass-chip rounded-full px-2.5 py-1">
                      from {branch.parent_branch_ids.join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
