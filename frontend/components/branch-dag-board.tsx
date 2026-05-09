import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import {
  build_line_color_map,
  build_line_depth_map,
  sort_nodes_by_id_desc,
} from "@/lib/graph";
import { truncate_text } from "@/lib/format";
import type { LineResponse, ProgressNodeResponse } from "@/lib/types/api";

interface BranchDagBoardProps {
  lines: LineResponse[];
  nodes: ProgressNodeResponse[];
}

export function BranchDagBoard({ lines, nodes }: BranchDagBoardProps) {
  if (lines.length === 0) {
    return (
      <SectionCard title="Project Graph" eyebrow="Node DAG">
        <p className="text-sm leading-6 muted-copy">No project graph is available yet.</p>
      </SectionCard>
    );
  }

  const ordered_nodes = sort_nodes_by_id_desc(nodes);
  const color_map = build_line_color_map(lines);
  const depth_map = build_line_depth_map(lines);
  const line_map = new Map(lines.map((line) => [line.id, line]));

  return (
    <SectionCard
      title="Project Graph"
      eyebrow="Node DAG"
      description="The graph centers on progress nodes, not task cards. Merge nodes make reconvergence visible at a glance."
      action={<StatusBadge label={`${ordered_nodes.length} nodes`} tone="advisor" />}
    >
      <div className="space-y-2">
        {ordered_nodes.map((node, index) => {
          const line = line_map.get(node.line_id);
          const depth = depth_map.get(node.line_id) ?? 0;
          const color = color_map.get(node.line_id) ?? "var(--advisor-accent)";
          const is_merge = node.node_kind === "merge";

          return (
            <div
              key={node.id}
              className="flex items-start gap-4 rounded-[var(--radius-sm)] px-3 py-3"
              style={{ paddingLeft: `${0.85 + depth * 1.05}rem` }}
            >
              <div className="relative flex min-h-8 flex-col items-center pt-1">
                {index < ordered_nodes.length - 1 ? (
                  <span
                    className="absolute left-1/2 top-4 h-[calc(100%+1.2rem)] w-px -translate-x-1/2"
                    style={{ backgroundColor: "rgba(77, 71, 58, 0.18)" }}
                  />
                ) : null}
                <span
                  className={[
                    "relative z-10 block h-4 w-4 rounded-full border-2 bg-[var(--surface-strong)]",
                    is_merge ? "ring-2 ring-[var(--terracotta-soft)]" : "",
                  ].join(" ")}
                  style={{
                    borderColor: color,
                    backgroundColor: line?.line_type === "main" ? color : "var(--surface-strong)",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1 rounded-[var(--radius-sm)] border border-border-subtle bg-white/46 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground md:text-base">
                    {node.title}
                  </h3>
                  <StatusBadge label={line?.line_type ?? "line"} tone="advisor" />
                  {is_merge ? <StatusBadge label="merge" tone="success" /> : null}
                </div>
                <p className="text-sm leading-6 muted-copy">{truncate_text(node.content, 92)}</p>
                <div className="flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
                  <span className="glass-chip rounded-full px-2.5 py-1">
                    {line?.title ?? node.line_title}
                  </span>
                  <span className="glass-chip rounded-full px-2.5 py-1">{node.author_name}</span>
                  {node.parent_node_ids.length > 0 ? (
                    <span className="glass-chip rounded-full px-2.5 py-1">
                      from {node.parent_node_ids.join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
