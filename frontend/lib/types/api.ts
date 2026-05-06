export interface BranchSummary {
  id: number;
  project_id: number;
  parent_branch_ids: number[];
  owner_id: number;
  owner_name: string;
  title: string;
  goal: string | null;
  status: string;
  branch_type: "main" | "personal" | "sub";
  created_at: string;
  child_branch_ids?: number[];
}

export interface ProjectResponse {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  status: string;
  main_branch_id: number;
  branches: BranchSummary[];
}

export interface MeetingTaskResponse {
  id: number;
  meeting_id: number;
  assignee_id: number;
  assignee_name: string;
  branch_id: number;
  branch_title: string;
  description: string;
  due_hint: string | null;
  status: string;
  created_at: string;
}

export interface MeetingResponse {
  id: number;
  project_id: number;
  title: string;
  scheduled_at: string | null;
  raw_notes: string | null;
  ai_briefing: string | null;
  briefing_status: string;
  briefing_error: string | null;
  ai_summary: string | null;
  summary_status: string;
  summary_error: string | null;
  task_split_status: string;
  task_split_error: string | null;
  created_at: string;
  tasks: MeetingTaskResponse[];
}

export interface UpdateResponse {
  id: number;
  branch_id: number;
  author_id: number;
  content: string;
  blockers: string | null;
  next_step: string | null;
  ai_summary: string | null;
  ai_suggested_subbranches: string[];
  ai_status: string;
  ai_error: string | null;
  created_at: string;
}

export interface QaCitation {
  source_type: string;
  source_id: number;
  snippet: string;
}

export interface QaResponse {
  answer: string;
  status: "answered" | "insufficient_information";
  citations: QaCitation[];
}

export interface QaRequest {
  project_id: number;
  question: string;
}

export interface CreateUpdateRequest {
  branch_id: number;
  author_id: number;
  content: string;
  blockers: string | null;
  next_step: string | null;
}

export interface UpdateTaskRequest {
  status: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
}
