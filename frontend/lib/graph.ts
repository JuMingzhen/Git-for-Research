import type { LineResponse, ProgressNodeResponse } from "@/lib/types/api";

const LINE_COLORS = [
  "var(--student-accent)",
  "var(--brass)",
  "var(--terracotta)",
  "var(--advisor-accent)",
  "var(--success)",
];

export function sort_lines_by_id(lines: LineResponse[]) {
  return [...lines].sort((left, right) => left.id - right.id);
}

export function sort_nodes_by_id_asc(nodes: ProgressNodeResponse[]) {
  return [...nodes].sort((left, right) => left.id - right.id);
}

export function sort_nodes_by_id_desc(nodes: ProgressNodeResponse[]) {
  return [...nodes].sort((left, right) => right.id - left.id);
}

export function build_line_color_map(lines: LineResponse[]) {
  const ordered_lines = sort_lines_by_id(lines);
  return new Map(
    ordered_lines.map((line, index) => [line.id, LINE_COLORS[index % LINE_COLORS.length]]),
  );
}

export function build_line_depth_map(lines: LineResponse[]) {
  const line_map = new Map(lines.map((line) => [line.id, line]));
  const depth_map = new Map<number, number>();

  function resolve_depth(line_id: number): number {
    const cached = depth_map.get(line_id);
    if (cached !== undefined) {
      return cached;
    }

    const line = line_map.get(line_id);
    if (!line || line.parent_line_id === null || !line_map.has(line.parent_line_id)) {
      depth_map.set(line_id, 0);
      return 0;
    }

    const depth = resolve_depth(line.parent_line_id) + 1;
    depth_map.set(line_id, depth);
    return depth;
  }

  for (const line of lines) {
    resolve_depth(line.id);
  }

  return depth_map;
}

export function group_nodes_by_line(nodes: ProgressNodeResponse[]) {
  const grouped = new Map<number, ProgressNodeResponse[]>();

  for (const node of sort_nodes_by_id_desc(nodes)) {
    const existing = grouped.get(node.line_id) ?? [];
    grouped.set(node.line_id, [...existing, node]);
  }

  return grouped;
}
