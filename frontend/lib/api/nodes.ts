import { apiFetch } from "@/lib/api/client";
import type { CreateNodeRequest, ProgressNodeResponse } from "@/lib/types/api";

export function get_node(node_id: number) {
  return apiFetch<ProgressNodeResponse>(`/nodes/${node_id}`);
}

export function get_line_nodes(line_id: number) {
  return apiFetch<ProgressNodeResponse[]>(`/lines/${line_id}/nodes`);
}

export function create_node(payload: CreateNodeRequest) {
  return apiFetch<ProgressNodeResponse>("/nodes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
