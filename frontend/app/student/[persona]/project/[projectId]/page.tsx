import { notFound } from "next/navigation";

import { StudentWorkspace } from "@/components/student-workspace";
import { get_branch, get_branch_updates } from "@/lib/api/branches";
import { get_project, get_project_tasks } from "@/lib/api/projects";
import { getPersonaConfig } from "@/lib/demo/config";
import type { BranchSummary } from "@/lib/types/api";
import type { DemoPersona } from "@/lib/types/demo";

interface StudentProjectPageProps {
  params: Promise<{
    persona: string;
    projectId: string;
  }>;
}

const student_personas = new Set<DemoPersona>(["student-a", "student-b"]);

export default async function StudentProjectPage({
  params,
}: StudentProjectPageProps) {
  const { persona, projectId } = await params;

  if (!student_personas.has(persona as DemoPersona)) {
    notFound();
  }

  const project_id = Number(projectId);
  if (Number.isNaN(project_id)) {
    notFound();
  }

  const config = getPersonaConfig(persona as DemoPersona);
  const project = await get_project(project_id);
  const matching_personal_branch =
    project.branches.find(
      (branch) =>
        branch.branch_type === "personal" &&
        (branch.id === config.branch_id || branch.owner_id === config.owner_id),
    ) ??
    project.branches.find(
      (branch) =>
        branch.branch_type === "personal" &&
        branch.owner_name === (config.display_name ?? config.label),
    );

  if (!matching_personal_branch) {
    notFound();
  }

  const branch = await get_branch(matching_personal_branch.id);
  const [updates_result, tasks_result] = await Promise.allSettled([
    get_branch_updates(branch.id),
    get_project_tasks(project.id),
  ]);

  const updates = updates_result.status === "fulfilled" ? updates_result.value : [];
  const updates_error_message =
    updates_result.status === "rejected"
      ? updates_result.reason instanceof Error
        ? updates_result.reason.message
        : "Update history could not be loaded."
      : undefined;

  const project_tasks = tasks_result.status === "fulfilled" ? tasks_result.value : [];
  const tasks_error_message =
    tasks_result.status === "rejected"
      ? tasks_result.reason instanceof Error
        ? tasks_result.reason.message
        : "Task inbox could not be loaded."
      : undefined;

  const branch_graph = project.branches.filter(
    (project_branch): project_branch is BranchSummary =>
      project_branch.owner_id === branch.owner_id &&
      (project_branch.branch_type === "personal" || project_branch.branch_type === "sub"),
  );
  const student_tasks = project_tasks.filter(
    (task) => task.branch_id === branch.id || task.assignee_id === branch.owner_id,
  );

  return (
    <StudentWorkspace
      config={config}
      project={project}
      branch={branch}
      branch_graph={branch_graph}
      initial_updates={updates}
      updates_error_message={updates_error_message}
      initial_tasks={student_tasks}
      tasks_error_message={tasks_error_message}
    />
  );
}
