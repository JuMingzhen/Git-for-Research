import { apiFetch } from "@/lib/api/client";
import type {
  LineResponse,
  MeetingResponse,
  MeetingTaskResponse,
  ProjectGraphResponse,
  ProjectResponse,
  QaRequest,
  QaResponse,
} from "@/lib/types/api";

export function get_project(project_id: number) {
  return apiFetch<ProjectResponse>(`/projects/${project_id}`);
}

export function get_project_lines(project_id: number) {
  return apiFetch<LineResponse[]>(`/projects/${project_id}/lines`);
}

export function get_project_graph(project_id: number) {
  return apiFetch<ProjectGraphResponse>(`/projects/${project_id}/graph`);
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
