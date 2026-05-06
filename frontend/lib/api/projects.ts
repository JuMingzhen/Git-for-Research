import { apiFetch } from "@/lib/api/client";
import type {
  MeetingResponse,
  MeetingTaskResponse,
  ProjectResponse,
  QaRequest,
  QaResponse,
} from "@/lib/types/api";

export function get_project(project_id: number) {
  return apiFetch<ProjectResponse>(`/projects/${project_id}`);
}

export function get_project_meetings(project_id: number) {
  return apiFetch<MeetingResponse[]>(`/projects/${project_id}/meetings`);
}

export function get_project_tasks(project_id: number) {
  return apiFetch<MeetingTaskResponse[]>(`/projects/${project_id}/tasks`);
}

export function ask_project_qa(payload: QaRequest) {
  return apiFetch<QaResponse>("/qa/ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
