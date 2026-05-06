import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { truncate_text } from "@/lib/format";
import type { BranchSummary } from "@/lib/types/api";

interface BranchDagBoardProps {
  branches: BranchSummary[];
}

interface LayoutNode {
  branch: BranchSummary;
  x: number;
  y: number;
}

export function BranchDagBoard({ branches }: BranchDagBoardProps) {
  if (branches.length === 0) {
    return (
      <SectionCard
        title="Project Branch DAG"
        eyebrow="Research Structure"
        description="This panel is reserved for the project-wide branch structure."
      >
        <p className="text-sm leading-6 muted-copy">
          No branches are available for this project yet.
        </p>
      </SectionCard>
    );
  }

  const sorted_branches = [...branches].sort((left, right) => left.id - right.id);
  const branch_map = new Map(sorted_branches.map((branch) => [branch.id, branch]));
  const depth_map = new Map<number, number>();
  const child_count_map = new Map<number, number>();

  for (const branch of sorted_branches) {
    for (const parent_id of branch.parent_branch_ids) {
      child_count_map.set(parent_id, (child_count_map.get(parent_id) ?? 0) + 1);
    }
  }

  function get_depth(branch_id: number): number {
    const cached = depth_map.get(branch_id);
    if (cached !== undefined) {
      return cached;
    }

    const branch = branch_map.get(branch_id);
    if (!branch) {
      return 0;
    }

    const depth =
      branch.parent_branch_ids.length === 0
        ? 0
        : Math.max(...branch.parent_branch_ids.map((parent_id) => get_depth(parent_id))) + 1;

    depth_map.set(branch_id, depth);
    return depth;
  }

  const columns = new Map<number, BranchSummary[]>();
  for (const branch of sorted_branches) {
    const depth = get_depth(branch.id);
    const group = columns.get(depth) ?? [];
    group.push(branch);
    columns.set(depth, group);
  }

  const ordered_depths = [...columns.keys()].sort((left, right) => left - right);
  const max_rows = Math.max(...ordered_depths.map((depth) => columns.get(depth)?.length ?? 0));
  const layout_nodes = new Map<number, LayoutNode>();

  ordered_depths.forEach((depth, column_index) => {
    const column_branches = columns.get(depth) ?? [];
    column_branches.forEach((branch, row_index) => {
      const x = ((column_index + 0.5) / ordered_depths.length) * 100;
      const y = ((row_index + 0.5) / max_rows) * 100;
      layout_nodes.set(branch.id, { branch, x, y });
    });
  });

  const connections = sorted_branches.flatMap((branch) =>
    branch.parent_branch_ids
      .map((parent_id) => {
        const parent = layout_nodes.get(parent_id);
        const child = layout_nodes.get(branch.id);

        if (!parent || !child) {
          return null;
        }

        return { parent, child };
      })
      .filter((item): item is { parent: LayoutNode; child: LayoutNode } => item !== null),
  );

  const board_height = Math.max(26, max_rows * 10);

  return (
    <SectionCard
      title="Project Branch DAG"
      eyebrow="Research Structure"
      description="The center of gravity for the advisor view: one shared spine, student-owned tracks, and merge milestones where split work reconverges."
      action={<StatusBadge label={`${branches.length} nodes`} tone="advisor" />}
    >
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(248,242,232,0.6))] p-4 md:p-6">
        <div className="mb-5 flex flex-wrap gap-3 text-xs">
          <StatusBadge label="main branch" tone="warning" />
          <StatusBadge label="personal branch" tone="advisor" />
          <StatusBadge label="sub-branch" tone="student" />
          <StatusBadge label="merge milestone" tone="success" />
        </div>
        <div className="relative overflow-x-auto">
          <div
            className="relative min-w-[900px]"
            style={{ minHeight: `${board_height}rem` }}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {connections.map(({ parent, child }) => {
                const control_x = (parent.x + child.x) / 2;
                const path = `M ${parent.x} ${parent.y} C ${control_x} ${parent.y}, ${control_x} ${child.y}, ${child.x} ${child.y}`;
                const is_merge = child.branch.parent_branch_ids.length > 1;

                return (
                  <path
                    key={`${parent.branch.id}-${child.branch.id}`}
                    d={path}
                    fill="none"
                    stroke={is_merge ? "rgba(184, 138, 71, 0.72)" : "rgba(31, 74, 60, 0.42)"}
                    strokeWidth={is_merge ? 0.45 : 0.32}
                    strokeDasharray={is_merge ? "0" : "1.3 0.8"}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div
              className="relative grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${ordered_depths.length}, minmax(0, 1fr))`,
                minHeight: `${board_height}rem`,
              }}
            >
              {ordered_depths.map((depth) => {
                const column_branches = columns.get(depth) ?? [];

                return (
                  <div
                    key={depth}
                    className="flex flex-col gap-5"
                    style={{
                      paddingTop: "0.5rem",
                      justifyContent: max_rows > 1 ? "space-around" : "flex-start",
                    }}
                  >
                    {column_branches.map((branch) => {
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
                          className="relative rounded-[var(--radius-sm)] border border-border-subtle bg-white/78 p-4 shadow-[var(--shadow-soft)]"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <StatusBadge label={branch.branch_type} tone={tone} />
                            {is_merge ? (
                              <StatusBadge label="merge" tone="success" />
                            ) : null}
                          </div>
                          <h3 className="text-base font-semibold text-foreground">
                            {branch.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 muted-copy">
                            {branch.owner_name}
                          </p>
                          <p className="mt-3 text-sm leading-6 rich-copy">
                            {truncate_text(
                              branch.goal ?? "No written goal captured for this branch yet.",
                              100,
                            )}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
                            <span className="glass-chip rounded-full px-2.5 py-1">
                              node #{branch.id}
                            </span>
                            <span className="glass-chip rounded-full px-2.5 py-1">
                              {child_count_map.get(branch.id) ?? 0} children
                            </span>
                            {branch.parent_branch_ids.length > 1 ? (
                              <span className="glass-chip rounded-full px-2.5 py-1">
                                {branch.parent_branch_ids.length} parents
                              </span>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
