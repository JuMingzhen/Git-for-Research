export type PersonaTheme = "advisor" | "student";

export type DemoPersona = "advisor" | "student-a" | "student-b";

export interface DemoPersonaConfig {
  key: DemoPersona;
  label: string;
  theme: PersonaTheme;
  project_id: number;
  owner_id?: number;
  line_id?: number;
  display_name?: string;
  href: string;
  summary: string;
  focus: string;
}
