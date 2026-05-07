"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BranchDetailPanel } from "@/components/branch-detail-panel";
import { ErrorState } from "@/components/error-state";
import { PersonalDagBoard } from "@/components/personal-dag-board";
import { PersonalQaPanel } from "@/components/personal-qa-panel";
import { RefreshButton } from "@/components/refresh-button";
import { StudentHero } from "@/components/student-hero";
import { TaskInbox } from "@/components/task-inbox";
import { UpdateComposer } from "@/components/update-composer";
import { UpdateTimeline } from "@/components/update-timeline";
import { WorkspaceNav } from "@/components/workspace-nav";
import { get_branch_updates } from "@/lib/api/branches";
import type {
  BranchSummary,
  MeetingTaskResponse,
  ProjectResponse,
  UpdateResponse,
} from "@/lib/types/api";
import type { DemoPersonaConfig } from "@/lib/types/demo";

interface StudentWorkspaceProps {
  config: DemoPersonaConfig;
  project: ProjectResponse;
  branch: BranchSummary;
  branch_graph: BranchSummary[];
  initial_updates: UpdateResponse[];
  updates_error_message?: string;
  initial_tasks: MeetingTaskResponse[];
  tasks_error_message?: string;
}

export function StudentWorkspace({
  config,
  project,
  branch,
  branch_graph,
  initial_updates,
  updates_error_message,
  initial_tasks,
  tasks_error_message,
}: StudentWorkspaceProps) {
  const [branches, setBranches] = useState(branch_graph);
  const [selected_branch_id, setSelectedBranchId] = useState(branch.id);
  const [active_branch_id, setActiveBranchId] = useState(branch.id);
  const [updates_by_branch_id, setUpdatesByBranchId] = useState<Record<number, UpdateResponse[]>>({
    [branch.id]: initial_updates,
  });
  const [updates_loading, setUpdatesLoading] = useState(false);
  const [updates_error, setUpdatesError] = useState<string | null>(
    updates_error_message ?? null,
  );
  const [tasks, setTasks] = useState(initial_tasks);

  const selected_branch =
    branches.find((candidate) => candidate.id === selected_branch_id) ?? branch;
  const active_branch =
    branches.find((candidate) => candidate.id === active_branch_id) ?? branch;
  const selected_updates = updates_by_branch_id[selected_branch.id] ?? [];

  const branch_tasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.branch_id === selected_branch.id || task.assignee_id === selected_branch.owner_id,
      ),
    [selected_branch.id, selected_branch.owner_id, tasks],
  );

  function handle_update_created(next_update: UpdateResponse) {
    setSelectedBranchId(active_branch_id);
    setUpdatesError(null);
    setUpdatesByBranchId((current_updates) => ({
      ...current_updates,
      [active_branch_id]: [next_update, ...(current_updates[active_branch_id] ?? [])],
    }));
  }

  function handle_task_updated(next_task: MeetingTaskResponse) {
    setTasks((current_tasks) =>
      current_tasks.map((task) => (task.id === next_task.id ? next_task : task)),
    );
  }

  function handle_branch_created(next_branch: BranchSummary) {
    setBranches((current_branches) => {
      const known_ids = new Set(current_branches.map((candidate) => candidate.id));
      const patched_branches = current_branches.map((candidate) => {
        if (!next_branch.parent_branch_ids.includes(candidate.id)) {
          return candidate;
        }

        const next_child_ids = Array.from(
          new Set([...(candidate.child_branch_ids ?? []), next_branch.id]),
        ).sort((left, right) => left - right);

        return {
          ...candidate,
          child_branch_ids: next_child_ids,
        };
      });

      return known_ids.has(next_branch.id) ? patched_branches : [...patched_branches, next_branch];
    });
    setSelectedBranchId(next_branch.id);
    setActiveBranchId(next_branch.id);
    setUpdatesByBranchId((current_updates) =>
      current_updates[next_branch.id]
        ? current_updates
        : { ...current_updates, [next_branch.id]: [] },
    );
    setUpdatesError(null);
  }

  async function handle_select_branch(next_branch_id: number) {
    setSelectedBranchId(next_branch_id);

    if (updates_by_branch_id[next_branch_id]) {
      setUpdatesLoading(false);
      setUpdatesError(null);
      return;
    }

    setUpdatesLoading(true);
    setUpdatesError(null);

    try {
      const next_updates = await get_branch_updates(next_branch_id);
      setUpdatesByBranchId((current_updates) => ({
        ...current_updates,
        [next_branch_id]: next_updates,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Updates could not be loaded.";
      setUpdatesError(message);
    } finally {
      setUpdatesLoading(false);
    }
  }

  return (
    <AppShell
      personaTheme="student"
      eyebrow={`${config.label} Workspace / Project ${project.id}`}
      title="Student workspace"
      description="Track the current branch, update progress, and merge work back into one milestone."
      badgeLabel={config.label}
      footer={<WorkspaceNav current_persona={config.key} />}
    >
      <StudentHero
        display_name={config.display_name ?? config.label}
        branch={active_branch}
        tasks={tasks}
        updates={updates_by_branch_id[active_branch.id] ?? []}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PersonalDagBoard
          root_branch_id={branch.id}
          branches={branches}
          selected_branch_id={selected_branch.id}
          active_branch_id={active_branch.id}
          on_select_branch={handle_select_branch}
        />
        <BranchDetailPanel
          project_id={project.id}
          owner_id={config.owner_id ?? branch.owner_id}
          branches={branches}
          selected_branch={selected_branch}
          active_branch_id={active_branch.id}
          on_activate_branch={setActiveBranchId}
          on_branch_created={handle_branch_created}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <UpdateTimeline
          branch_title={selected_branch.title}
          updates={selected_updates}
          is_loading={updates_loading}
          error_message={updates_error ?? undefined}
        />
        <TaskInbox
          tasks={branch_tasks}
          error_message={tasks_error_message}
          on_task_updated={handle_task_updated}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <UpdateComposer
          branch_id={active_branch.id}
          branch_title={active_branch.title}
          author_id={config.owner_id ?? branch.owner_id}
          display_name={config.display_name ?? config.label}
          on_update_created={handle_update_created}
        />
        <PersonalQaPanel
          project_id={project.id}
          display_name={config.display_name ?? config.label}
        />
      </div>
      {updates_error_message ? (
        <ErrorState
          title="Initial updates unavailable"
          description={`Initial update fetch failed: ${updates_error_message}`}
          action={<RefreshButton label="Retry update fetch" tone="student" />}
        />
      ) : null}
    </AppShell>
  );
}
