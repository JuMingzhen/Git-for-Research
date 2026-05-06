import type { DemoPersona, DemoPersonaConfig } from "@/lib/types/demo";

export const DEFAULT_PROJECT_ID = 1;

export const DEMO_PERSONAS: DemoPersonaConfig[] = [
  {
    key: "advisor",
    label: "Advisor",
    theme: "advisor",
    project_id: DEFAULT_PROJECT_ID,
    href: `/advisor/project/${DEFAULT_PROJECT_ID}`,
    summary: "See the whole project as a research command room before and after group meetings.",
    focus: "Global branch health, meeting briefs, task reflux, and historical questioning.",
  },
  {
    key: "student-a",
    label: "Student A",
    theme: "student",
    project_id: DEFAULT_PROJECT_ID,
    href: `/student/student-a/project/${DEFAULT_PROJECT_ID}`,
    summary: "Review a personal research track with experiments, blockers, and merge milestones.",
    focus: "Personal DAG, recent updates, task inbox, and progress composer.",
  },
  {
    key: "student-b",
    label: "Student B",
    theme: "student",
    project_id: DEFAULT_PROJECT_ID,
    href: `/student/student-b/project/${DEFAULT_PROJECT_ID}`,
    summary: "Open a second student workspace to compare another branch of the same project.",
    focus: "Evaluation workflow, meeting tasks, and role-specific history review.",
  },
];

export function getPersonaConfig(persona: DemoPersona): DemoPersonaConfig {
  const config = DEMO_PERSONAS.find((item) => item.key === persona);
  if (!config) {
    throw new Error(`Unknown demo persona: ${persona}`);
  }

  return config;
}
