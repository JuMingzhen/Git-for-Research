import type { DemoPersona, DemoPersonaConfig } from "@/lib/types/demo";

export const DEFAULT_PROJECT_ID = 1;

export const DEMO_PERSONAS: DemoPersonaConfig[] = [
  {
    key: "advisor",
    label: "Advisor",
    theme: "advisor",
    project_id: DEFAULT_PROJECT_ID,
    display_name: "Advisor A",
    href: `/advisor/project/${DEFAULT_PROJECT_ID}`,
    summary: "See the whole project as a research command room before and after group meetings.",
    focus: "Global branch health, meeting briefs, task reflux, and historical questioning.",
  },
  {
    key: "student-a",
    label: "Student A",
    theme: "student",
    project_id: DEFAULT_PROJECT_ID,
    owner_id: 2,
    line_id: 2,
    display_name: "Student A",
    href: `/student/student-a/project/${DEFAULT_PROJECT_ID}`,
    summary: "Open Student A's working lines and recent nodes.",
    focus: "Current line, node history, merge updates, and task prompts.",
  },
  {
    key: "student-b",
    label: "Student B",
    theme: "student",
    project_id: DEFAULT_PROJECT_ID,
    owner_id: 3,
    line_id: 3,
    display_name: "Student B",
    href: `/student/student-b/project/${DEFAULT_PROJECT_ID}`,
    summary: "Open Student B's line and compare a different workflow.",
    focus: "Evaluation flow, task prompts, and line history.",
  },
];

export function getPersonaConfig(persona: DemoPersona): DemoPersonaConfig {
  const config = DEMO_PERSONAS.find((item) => item.key === persona);
  if (!config) {
    throw new Error(`Unknown demo persona: ${persona}`);
  }

  return config;
}
