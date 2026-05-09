"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/error-state";
import { LineControlPanel } from "@/components/line-control-panel";
import { PersonalDagBoard } from "@/components/personal-dag-board";
import { PersonalQaPanel } from "@/components/personal-qa-panel";
import { RefreshButton } from "@/components/refresh-button";
import { StudentHero } from "@/components/student-hero";
import { TaskInbox } from "@/components/task-inbox";
import { UpdateComposer } from "@/components/update-composer";
import { UpdateTimeline } from "@/components/update-timeline";
import { WorkspaceNav } from "@/components/workspace-nav";
import { get_line_nodes } from "@/lib/api/nodes";
import { group_nodes_by_line, sort_lines_by_id, sort_nodes_by_id_asc } from "@/lib/graph";
import type {
  LineResponse,
  MeetingTaskResponse,
  ProgressNodeResponse,
  ProjectGraphResponse,
  ProjectResponse,
} from "@/lib/types/api";
import type { DemoPersonaConfig } from "@/lib/types/demo";
import { usePersistentState } from "@/lib/use-persistent-state";

interface StudentWorkspaceProps {
  config: DemoPersonaConfig;
  project: ProjectResponse;
  graph: ProjectGraphResponse;
  personal_line: LineResponse;
  initial_line_nodes: ProgressNodeResponse[];
  line_nodes_error_message?: string;
  initial_tasks: MeetingTaskResponse[];
  tasks_error_message?: string;
}

export function StudentWorkspace({
  config,
  project,
  graph,
  personal_line,
  initial_line_nodes,
  line_nodes_error_message,
  initial_tasks,
  tasks_error_message,
}: StudentWorkspaceProps) {
  const initial_lines = sort_lines_by_id(
    graph.lines.filter(
      (line) => line.owner_id === personal_line.owner_id && line.line_type !== "main",
    ),
  );
  const initial_nodes = sort_nodes_by_id_asc(
    graph.nodes.filter((node) => initial_lines.some((line) => line.id === node.line_id)),
  );
  const derived_histories = group_nodes_by_line(initial_nodes);

  const [lines, setLines] = useState(initial_lines);
  const [nodes, setNodes] = useState(initial_nodes);
  const current_line_state = usePersistentState<number>(
    `gfr:student-workspace:current-line:${project.id}:${personal_line.owner_id}`,
    personal_line.id,
  );
  const selected_node_state = usePersistentState<number | null>(
    `gfr:student-workspace:selected-node:${project.id}:${personal_line.owner_id}`,
    initial_line_nodes[0]?.id ?? personal_line.head_node_id ?? null,
  );
  const [line_history_by_line_id, setLineHistoryByLineId] = useState<
    Record<number, ProgressNodeResponse[]>
  >(() => ({
    ...Object.fromEntries(Array.from(derived_histories.entries())),
    [personal_line.id]: initial_line_nodes,
  }));
  const [loaded_line_ids, setLoadedLineIds] = useState<Set<number>>(
    () => new Set([personal_line.id]),
  );
  const [line_history_loading, setLineHistoryLoading] = useState(false);
  const [line_history_error, setLineHistoryError] = useState<string | null>(
    line_nodes_error_message ?? null,
  );
  const [tasks, setTasks] = useState(initial_tasks);
  const setCurrentLineId = current_line_state.setValue;
  const setSelectedNodeId = selected_node_state.setValue;
  const current_line_id = current_line_state.value;
  const selected_node_id = selected_node_state.value;

  const line_map = useMemo(() => new Map(lines.map((line) => [line.id, line])), [lines]);
  const node_map = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const current_line = line_map.get(current_line_id) ?? personal_line;
  const current_line_nodes =
    line_history_by_line_id[current_line.id] ??
    nodes
      .filter((node) => node.line_id === current_line.id)
      .sort((left, right) => right.id - left.id);
  const selected_node =
    (selected_node_id !== null ? node_map.get(selected_node_id) : null) ??
    current_line_nodes[0] ??
    null;
  const current_head_node =
    current_line.head_node_id !== null ? node_map.get(current_line.head_node_id) ?? null : null;

  async function activate_line(next_line_id: number) {
    setCurrentLineId(next_line_id);
    setLineHistoryError(null);

    if (!loaded_line_ids.has(next_line_id)) {
      setLineHistoryLoading(true);
      try {
        const next_nodes = await get_line_nodes(next_line_id);
        setLineHistoryByLineId((current) => ({
          ...current,
          [next_line_id]: next_nodes,
        }));
        setNodes((current) => {
          const by_id = new Map(current.map((node) => [node.id, node]));
          for (const node of next_nodes) {
            by_id.set(node.id, node);
          }
          return sort_nodes_by_id_asc(Array.from(by_id.values()));
        });
        setLoadedLineIds((current) => new Set(current).add(next_line_id));
        setSelectedNodeId(
          next_nodes[0]?.id ?? line_map.get(next_line_id)?.head_node_id ?? null,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Node history could not be loaded.";
        setLineHistoryError(message);
      } finally {
        setLineHistoryLoading(false);
      }
      return;
    }

    const existing_nodes =
      line_history_by_line_id[next_line_id] ??
      nodes
        .filter((node) => node.line_id === next_line_id)
        .sort((left, right) => right.id - left.id);
    setSelectedNodeId(
      existing_nodes[0]?.id ?? line_map.get(next_line_id)?.head_node_id ?? null,
    );
  }

  function handle_line_created(next_line: LineResponse) {
    setLines((current) => sort_lines_by_id([...current, next_line]));
    setLineHistoryByLineId((current) => ({
      ...current,
      [next_line.id]: current[next_line.id] ?? [],
    }));
    setLoadedLineIds((current) => new Set(current).add(next_line.id));
    setCurrentLineId(next_line.id);
    setSelectedNodeId(next_line.head_node_id);
    setLineHistoryError(null);
  }

  function handle_node_created(next_node: ProgressNodeResponse) {
    setNodes((current) => sort_nodes_by_id_asc([...current, next_node]));
    setLineHistoryByLineId((current) => ({
      ...current,
      [next_node.line_id]: [next_node, ...(current[next_node.line_id] ?? [])],
    }));
    setLines((current) =>
      current.map((line) =>
        line.id === next_node.line_id ? { ...line, head_node_id: next_node.id } : line,
      ),
    );
    setLoadedLineIds((current) => new Set(current).add(next_node.line_id));
    setCurrentLineId(next_node.line_id);
    setSelectedNodeId(next_node.id);
    setLineHistoryError(null);
  }

  function handle_task_updated(next_task: MeetingTaskResponse) {
    setTasks((current) =>
      current.map((task) => (task.id === next_task.id ? next_task : task)),
    );
  }

  return (
    <AppShell
      personaTheme="student"
      eyebrow={`${config.label} Workspace / Project ${project.id}`}
      title="Student workspace"
      description="Work one line at a time, submit nodes, and merge split tracks back into one milestone."
      badgeLabel={config.label}
      footer={<WorkspaceNav current_persona={config.key} />}
    >
      <StudentHero
        display_name={config.display_name ?? config.label}
        current_line={current_line}
        current_head_node={current_head_node}
        selected_node={selected_node}
        tasks={tasks}
      />
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <PersonalDagBoard
          lines={lines}
          nodes={nodes}
          selected_node_id={selected_node?.id ?? null}
          current_line_id={current_line.id}
          on_select_node={setSelectedNodeId}
        />
        <LineControlPanel
          key={`line-control-${current_line.id}`}
          project_id={project.id}
          owner_id={config.owner_id ?? personal_line.owner_id}
          lines={lines}
          current_line={current_line}
          selected_node={selected_node}
          on_activate_line={activate_line}
          on_line_created={handle_line_created}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <UpdateTimeline
          line_title={current_line.title}
          nodes={current_line_nodes}
          selected_node_id={selected_node?.id ?? null}
          is_loading={line_history_loading}
          error_message={line_history_error ?? undefined}
          on_select_node={setSelectedNodeId}
        />
        <TaskInbox
          tasks={tasks}
          error_message={tasks_error_message}
          on_task_updated={handle_task_updated}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <UpdateComposer
          key={`update-composer-${current_line.id}`}
          project_id={project.id}
          current_line={current_line}
          student_lines={lines}
          author_id={config.owner_id ?? personal_line.owner_id}
          display_name={config.display_name ?? config.label}
          on_node_created={handle_node_created}
        />
        <PersonalQaPanel
          project_id={project.id}
          display_name={config.display_name ?? config.label}
        />
      </div>
      {line_nodes_error_message ? (
        <ErrorState
          title="Initial node history unavailable"
          description={`Initial node fetch failed: ${line_nodes_error_message}`}
          action={<RefreshButton label="Retry node fetch" tone="student" />}
        />
      ) : null}
    </AppShell>
  );
}
