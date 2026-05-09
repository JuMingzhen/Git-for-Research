import { apiFetch } from "@/lib/api/client";
import type { CreateLineRequest, LineResponse } from "@/lib/types/api";

export function get_line(line_id: number) {
  return apiFetch<LineResponse>(`/lines/${line_id}`);
}

export function create_line(payload: CreateLineRequest) {
  return apiFetch<LineResponse>("/lines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
