import Link from "next/link";

import type { DemoPersonaConfig } from "@/lib/types/demo";
import { StatusBadge } from "@/components/status-badge";

interface PersonaCardProps {
  persona: DemoPersonaConfig;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const themeClass =
    persona.theme === "advisor"
      ? "from-advisor-accent/16 via-brass/8 to-transparent"
      : "from-student-accent/16 via-terracotta/8 to-transparent";

  return (
    <Link
      href={persona.href}
      className="group stagger-in rounded-[var(--radius-md)] border border-border-subtle bg-white/55 p-6 shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-float)]"
    >
      <div className={`mb-6 rounded-[var(--radius-sm)] bg-gradient-to-br ${themeClass} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <StatusBadge
            label={persona.theme === "advisor" ? "Advisor View" : "Student View"}
            tone={persona.theme}
          />
          <span className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
            Project {persona.project_id}
          </span>
        </div>
        <h2 className="display-title text-3xl font-medium text-foreground">
          {persona.label}
        </h2>
      </div>
      <div className="space-y-3">
        <p className="text-base leading-7 rich-copy">{persona.summary}</p>
        <p className="text-sm leading-6 muted-copy">{persona.focus}</p>
        <div className="pt-2 text-sm font-semibold text-[var(--persona-accent)] transition-transform duration-300 group-hover:translate-x-1">
          Enter demo workspace →
        </div>
      </div>
    </Link>
  );
}
