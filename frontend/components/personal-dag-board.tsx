import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import {
  build_line_color_map,
  build_line_depth_map,
  sort_nodes_by_id_desc,
} from "@/lib/graph";
import { truncate_text } from "@/lib/format";
import type { LineResponse, ProgressNodeResponse } from "@/lib/types/api";

interface PersonalDagBoardProps {
  lines: LineResponse[];
  nodes: ProgressNodeResponse[];
  selected_node_id: number | null;
  current_line_id: number;
  on_select_node: (node_id: number) => void;
}

export function PersonalDagBoard({
  lines,
  nodes,
  selected_node_id,
  current_line_id,
  on_select_node,
}: PersonalDagBoardProps) {
  if (lines.length === 0) {
    return (
      <SectionCard title="Node Graph" eyebrow="Notebook">
        <p className="text-sm leading-6 muted-copy">No student lines are available yet.</p>
      </SectionCard>
    );
  }

  const ordered_nodes = sort_nodes_by_id_desc(nodes);
  const color_map = build_line_color_map(lines);
  const depth_map = build_line_depth_map(lines);
  const line_map = new Map(lines.map((line) => [line.id, line]));

  return (
    <SectionCard
      title="Node Graph"
      eyebrow="Notebook"
      description="Each submitted update becomes a node. Merge updates reuse the same submit flow with multiple parents."
      action={<StatusBadge label={`${ordered_nodes.length} nodes`} tone="student" />}
    >
      <div className="space-y-2">
        {ordered_nodes.map((node, index) => {
          const line = line_map.get(node.line_id);
          const depth = depth_map.get(node.line_id) ?? 0;
          const color = color_map.get(node.line_id) ?? "var(--student-accent)";
          const is_selected = node.id === selected_node_id;
          const is_current_line = node.line_id === current_line_id;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => on_select_node(node.id)}
              className={[
                "group flex w-full items-start gap-4 rounded-[var(--radius-sm)] px-3 py-3 text-left transition",
                is_selected
                  ? "bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]"
                  : "hover:bg-white/50",
              ].join(" ")}
              style={{ paddingLeft: `${0.85 + depth * 1.1}rem` }}
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
                    node.node_kind === "merge" ? "ring-2 ring-[var(--terracotta-soft)]" : "",
                  ].join(" ")}
                  style={{
                    borderColor: color,
                    backgroundColor: is_current_line ? color : "var(--surface-strong)",
                    boxShadow: is_selected ? `0 0 0 4px color-mix(in srgb, ${color} 16%, white)` : undefined,
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground md:text-base">
                    {node.title}
                  </h3>
                  {is_current_line ? <StatusBadge label="current line" tone="student" /> : null}
                  {node.node_kind === "merge" ? (
                    <StatusBadge label="merge" tone="success" />
                  ) : null}
                </div>
                <p className="text-sm leading-6 muted-copy">
                  {truncate_text(node.content, 84)}
                </p>
                <div className="flex flex-wrap gap-2 text-[0.72rem] text-[var(--ink-muted)]">
                  <span className="glass-chip rounded-full px-2.5 py-1">
                    {line?.title ?? node.line_title}
                  </span>
                  <span className="glass-chip rounded-full px-2.5 py-1">node #{node.id}</span>
                  {node.parent_node_ids.length > 0 ? (
                    <span className="glass-chip rounded-full px-2.5 py-1">
                      from {node.parent_node_ids.join(", ")}
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
