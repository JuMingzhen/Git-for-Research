export interface LineResponse {
  id: number;
  project_id: number;
  owner_id: number;
  owner_name: string;
  title: string;
  goal: string | null;
  line_type: "main" | "personal" | "sub";
  parent_line_id: number | null;
  base_node_id: number | null;
  head_node_id: number | null;
  status: string;
  created_at: string;
}

export interface ProjectResponse {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  status: string;
  main_line_id: number;
  lines: LineResponse[];
}

export interface ProgressNodeResponse {
  id: number;
  project_id: number;
  line_id: number;
  line_title: string;
  author_id: number;
  author_name: string;
  title: string;
  content: string;
  blockers: string | null;
  next_step: string | null;
  node_kind: "initial" | "update" | "merge";
  parent_node_ids: number[];
  ai_summary: string | null;
  ai_suggested_subbranches: string[];
  ai_status: string;
  ai_error: string | null;
  created_at: string;
}

export interface NodeEdgeResponse {
  parent_node_id: number;
  child_node_id: number;
}

export interface ProjectGraphResponse {
  project_id: number;
  main_line_id: number;
  lines: LineResponse[];
  nodes: ProgressNodeResponse[];
  edges: NodeEdgeResponse[];
}

export interface MeetingTaskResponse {
  id: number;
  meeting_id: number;
  project_id: number;
  assignee_id: number;
  assignee_name: string;
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

export interface CreateLineRequest {
  project_id: number;
  owner_id: number;
  title: string;
  goal: string | null;
  line_type: "personal" | "sub";
  parent_line_id: number;
}

export interface CreateNodeRequest {
  project_id: number;
  line_id: number;
  author_id: number;
  title: string;
  content: string;
  blockers: string | null;
  next_step: string | null;
  parent_node_ids?: number[] | null;
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
