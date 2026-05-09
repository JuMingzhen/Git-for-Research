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
  get_project_graph,
  get_project_meetings,
  get_project_tasks,
} from "@/lib/api/projects";

interface AdvisorProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function AdvisorProjectPage({ params }: AdvisorProjectPageProps) {
  const { projectId } = await params;
  const project_id = Number(projectId);
  if (Number.isNaN(project_id)) {
    notFound();
  }

  const [project, graph, meetings_result, tasks_result] = await Promise.all([
    get_project(project_id),
    get_project_graph(project_id),
    get_project_meetings(project_id).catch((error: unknown) => error),
    get_project_tasks(project_id).catch((error: unknown) => error),
  ]);

  const meetings = Array.isArray(meetings_result) ? meetings_result : [];
  const tasks = Array.isArray(tasks_result) ? tasks_result : [];
  const meetings_error_message = meetings_result instanceof Error ? meetings_result.message : undefined;
  const tasks_error_message = tasks_result instanceof Error ? tasks_result.message : undefined;

  return (
    <AppShell
      personaTheme="advisor"
      eyebrow={`Advisor Workspace / Project ${projectId}`}
      title="Advisor workspace"
      description="Scan the project graph, meetings, task prompts, and history."
      badgeLabel="Advisor"
      footer={<WorkspaceNav current_persona="advisor" />}
    >
      <ProjectHero project={project} lines={graph.lines} nodes={graph.nodes} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <BranchDagBoard lines={graph.lines} nodes={graph.nodes} />
        <StudentStatusPanel
          lines={graph.lines}
          nodes={graph.nodes}
          tasks={tasks}
          tasks_error_message={tasks_error_message}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <MeetingListPanel meetings={meetings} error_message={meetings_error_message} />
        <TaskRefluxPanel tasks={tasks} error_message={tasks_error_message} />
      </div>
      <QaPanel project_id={project.id} />
    </AppShell>
  );
}
