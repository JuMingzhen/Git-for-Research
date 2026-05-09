import { notFound } from "next/navigation";

import { StudentWorkspace } from "@/components/student-workspace";
import { get_line_nodes } from "@/lib/api/nodes";
import { get_project, get_project_graph, get_project_tasks } from "@/lib/api/projects";
import { getPersonaConfig } from "@/lib/demo/config";
import type { DemoPersona } from "@/lib/types/demo";

interface StudentProjectPageProps {
  params: Promise<{
    persona: string;
    projectId: string;
  }>;
}

const student_personas = new Set<DemoPersona>(["student-a", "student-b"]);

export default async function StudentProjectPage({ params }: StudentProjectPageProps) {
  const { persona, projectId } = await params;

  if (!student_personas.has(persona as DemoPersona)) {
    notFound();
  }

  const project_id = Number(projectId);
  if (Number.isNaN(project_id)) {
    notFound();
  }

  const config = getPersonaConfig(persona as DemoPersona);
  const [project, graph, tasks_result] = await Promise.all([
    get_project(project_id),
    get_project_graph(project_id),
    get_project_tasks(project_id).catch((error: unknown) => error),
  ]);

  const personal_line =
    graph.lines.find(
      (line) =>
        line.line_type === "personal" &&
        (line.id === config.line_id || line.owner_id === config.owner_id),
    ) ??
    graph.lines.find(
      (line) =>
        line.line_type === "personal" &&
        line.owner_name === (config.display_name ?? config.label),
    );

  if (!personal_line) {
    notFound();
  }

  const line_nodes_result = await get_line_nodes(personal_line.id).catch((error: unknown) => error);
  const initial_line_nodes = Array.isArray(line_nodes_result) ? line_nodes_result : [];
  const line_nodes_error_message =
    line_nodes_result instanceof Error ? line_nodes_result.message : undefined;

  const project_tasks = Array.isArray(tasks_result) ? tasks_result : [];
  const tasks_error_message = tasks_result instanceof Error ? tasks_result.message : undefined;
  const student_tasks = project_tasks.filter((task) => task.assignee_id === personal_line.owner_id);

  return (
    <StudentWorkspace
      config={config}
      project={project}
      graph={graph}
      personal_line={personal_line}
      initial_line_nodes={initial_line_nodes}
      line_nodes_error_message={line_nodes_error_message}
      initial_tasks={student_tasks}
      tasks_error_message={tasks_error_message}
    />
  );
}
