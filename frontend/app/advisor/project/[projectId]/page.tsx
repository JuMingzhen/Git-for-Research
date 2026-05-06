import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BranchDagBoard } from "@/components/branch-dag-board";
import { MeetingListPanel } from "@/components/meeting-list-panel";
import { ProjectHero } from "@/components/project-hero";
import { QaPanel } from "@/components/qa-panel";
import { StudentStatusPanel } from "@/components/student-status-panel";
import { TaskRefluxPanel } from "@/components/task-reflux-panel";
import { WorkspaceNav } from "@/components/workspace-nav";
import {
  get_project,
  get_project_meetings,
  get_project_tasks,
} from "@/lib/api/projects";

interface AdvisorProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function AdvisorProjectPage({
  params,
}: AdvisorProjectPageProps) {
  const { projectId } = await params;
  const project_id = Number(projectId);
  if (Number.isNaN(project_id)) {
    notFound();
  }

  const project = await get_project(project_id);
  const [meetings_result, tasks_result] = await Promise.allSettled([
    get_project_meetings(project_id),
    get_project_tasks(project_id),
  ]);
  const meetings =
    meetings_result.status === "fulfilled" ? meetings_result.value : [];
  const tasks = tasks_result.status === "fulfilled" ? tasks_result.value : [];
  const meetings_error_message =
    meetings_result.status === "rejected"
      ? meetings_result.reason instanceof Error
        ? meetings_result.reason.message
        : "Meeting data could not be loaded."
      : undefined;
  const tasks_error_message =
    tasks_result.status === "rejected"
      ? tasks_result.reason instanceof Error
        ? tasks_result.reason.message
        : "Task data could not be loaded."
      : undefined;

  return (
    <AppShell
      personaTheme="advisor"
      eyebrow={`Advisor Workspace / Project ${projectId}`}
      title="A war-room view of branch structure, meeting closure, and project memory."
      description="This page is designed to let an advisor rebuild context quickly: understand the project DAG, inspect meeting outputs, see tasks flowing back into student tracks, and query history without rereading everything."
      badgeLabel="Advisor"
      footer={<WorkspaceNav current_persona="advisor" />}
    >
      <ProjectHero project={project} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <BranchDagBoard branches={project.branches} />
        <StudentStatusPanel
          branches={project.branches}
          tasks={tasks}
          tasks_error_message={tasks_error_message}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <MeetingListPanel
          meetings={meetings}
          error_message={meetings_error_message}
        />
        <TaskRefluxPanel
          tasks={tasks}
          error_message={tasks_error_message}
        />
      </div>
      <QaPanel project_id={project.id} />
    </AppShell>
  );
}
