import { apiFetch } from "@/lib/api/client";
import type {
  BranchSummary,
  CreateUpdateRequest,
  UpdateResponse,
} from "@/lib/types/api";

export function get_branch(branch_id: number) {
  return apiFetch<BranchSummary>(`/branches/${branch_id}`);
}

export function get_branch_updates(branch_id: number) {
  return apiFetch<UpdateResponse[]>(`/branches/${branch_id}/updates`);
}

export function create_update(payload: CreateUpdateRequest) {
  return apiFetch<UpdateResponse>("/updates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
