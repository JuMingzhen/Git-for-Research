"use client";

import Link from "next/link";
import { useState } from "react";

import { PersonalDagBoard } from "@/components/personal-dag-board";
import { PersonalQaPanel } from "@/components/personal-qa-panel";
import { StudentHero } from "@/components/student-hero";
import { TaskInbox } from "@/components/task-inbox";
import { UpdateComposer } from "@/components/update-composer";
import { UpdateTimeline } from "@/components/update-timeline";
import { AppShell } from "@/components/app-shell";
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
  const [updates, setUpdates] = useState(initial_updates);
  const [tasks, setTasks] = useState(initial_tasks);

  function handle_update_created(next_update: UpdateResponse) {
    setUpdates((current_updates) => [next_update, ...current_updates]);
  }

  function handle_task_updated(next_task: MeetingTaskResponse) {
    setTasks((current_tasks) =>
      current_tasks.map((task) => (task.id === next_task.id ? next_task : task)),
    );
  }

  return (
    <AppShell
      personaTheme="student"
      eyebrow={`${config.label} Workspace / Project ${project.id}`}
      title="A quieter workspace for one research track, with branch context always visible."
      description="This view is optimized for the student's real loop: keep the current branch legible, track blockers and next steps, act on meeting tasks, and record progress without losing structure."
      badgeLabel={config.label}
      footer={
        <div className="flex justify-end">
          <Link
            href="/demo"
            className="rounded-full border border-border-subtle bg-white/60 px-4 py-2 text-sm font-medium transition hover:border-border-strong hover:bg-white/80"
          >
            Back to demo entry
          </Link>
        </div>
      }
    >
      <StudentHero
        display_name={config.display_name ?? config.label}
        branch={branch}
        tasks={tasks}
        updates={updates}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PersonalDagBoard root_branch_id={branch.id} branches={branch_graph} />
        <TaskInbox
          tasks={tasks}
          error_message={tasks_error_message}
          on_task_updated={handle_task_updated}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <UpdateTimeline updates={updates} />
        <UpdateComposer
          branch_id={branch.id}
          author_id={config.owner_id ?? branch.owner_id}
          display_name={config.display_name ?? config.label}
          on_update_created={handle_update_created}
        />
      </div>
      {updates_error_message ? (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-[var(--warning-soft)] px-5 py-4 text-sm leading-6 text-[var(--warning)]">
          Update history could not be fully loaded: {updates_error_message}
        </div>
      ) : null}
      <PersonalQaPanel
        project_id={project.id}
        display_name={config.display_name ?? config.label}
      />
    </AppShell>
  );
}
