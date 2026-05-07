import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { truncate_text } from "@/lib/format";
import type { BranchSummary } from "@/lib/types/api";

interface BranchDagBoardProps {
  branches: BranchSummary[];
}

export function BranchDagBoard({ branches }: BranchDagBoardProps) {
  if (branches.length === 0) {
    return (
      <SectionCard title="Project Graph" eyebrow="Branches">
        <p className="text-sm leading-6 muted-copy">No branches yet.</p>
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

    const branch = branch_map.get(branch_id);
    if (!branch) {
      return 0;
    }

    const local_parents = branch.parent_branch_ids.filter((parent_id) => branch_map.has(parent_id));
    const depth =
      local_parents.length === 0
        ? 0
        : Math.max(...local_parents.map((parent_id) => get_depth(parent_id))) + 1;

    depth_map.set(branch_id, depth);
    return depth;
  }

  function dot_color(branch: BranchSummary) {
    if (branch.parent_branch_ids.length > 1) {
      return "var(--terracotta)";
    }

    if (branch.branch_type === "main") {
      return "var(--brass)";
    }

    if (branch.branch_type === "personal") {
      return "var(--advisor-accent)";
    }

    return "var(--student-accent)";
  }

  return (
    <SectionCard
      title="Project Graph"
      eyebrow="Branches"
      description="Main line, student tracks, and merge milestones."
      action={<StatusBadge label={`${branches.length} nodes`} tone="advisor" />}
    >
      <div className="space-y-2">
        {sorted_branches.map((branch, index) => {
          const depth = get_depth(branch.id);
          const is_merge = branch.parent_branch_ids.length > 1;
          const tone =
            branch.branch_type === "main"
              ? "warning"
              : branch.branch_type === "personal"
                ? "advisor"
                : is_merge
                  ? "success"
                  : "student";

          return (
            <article
              key={branch.id}
              className="flex items-start gap-4 rounded-[var(--radius-sm)] px-3 py-3 transition hover:bg-white/45"
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
                    borderColor: dot_color(branch),
                    backgroundColor:
                      branch.branch_type === "main" ? dot_color(branch) : "var(--surface-strong)",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground md:text-base">
                    {branch.title}
                  </h3>
                  <StatusBadge label={branch.branch_type} tone={tone} />
                  {is_merge ? <StatusBadge label="merge" tone="success" /> : null}
                </div>
                <p className="text-sm leading-6 muted-copy">
                  {branch.owner_name} /{" "}
                  {truncate_text(branch.goal ?? "No goal yet.", 88)}
                </p>
                <div className="flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
                  <span className="glass-chip rounded-full px-2.5 py-1">#{branch.id}</span>
                  {branch.parent_branch_ids.length > 0 ? (
                    <span className="glass-chip rounded-full px-2.5 py-1">
                      from {branch.parent_branch_ids.join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}
