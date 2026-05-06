import { apiFetch } from "@/lib/api/client";
import type { MeetingTaskResponse, UpdateTaskRequest } from "@/lib/types/api";

export function update_meeting_task(task_id: number, payload: UpdateTaskRequest) {
  return apiFetch<MeetingTaskResponse>(`/meeting-tasks/${task_id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
