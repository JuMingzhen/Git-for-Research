import type { ReactNode } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { PersonaTheme } from "@/lib/types/demo";

interface AppShellProps {
  personaTheme: PersonaTheme;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  badgeLabel?: string;
  footer?: ReactNode;
}

export function AppShell({
  personaTheme,
  eyebrow,
  title,
  description,
  children,
  badgeLabel,
  footer,
}: AppShellProps) {
  return (
    <div data-persona-theme={personaTheme} className="ambient-grid min-h-screen">
      <div className="page-inset">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="paper-panel soft-fade-in rounded-[var(--radius-lg)] px-6 py-7 md:px-8 md:py-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">
                  {eyebrow}
                </p>
                <h1 className="display-title max-w-4xl text-4xl font-medium leading-tight text-foreground md:text-5xl">
                  {title}
                </h1>
              </div>
              {badgeLabel ? (
                <StatusBadge
                  label={badgeLabel}
                  tone={personaTheme === "advisor" ? "advisor" : "student"}
                />
              ) : null}
            </div>
            <div className="shell-divider mb-5" />
            <p className="max-w-3xl text-base leading-7 rich-copy md:text-lg">
              {description}
            </p>
          </header>
          <main className="page-stack">{children}</main>
          {footer ? <footer className="soft-fade-in">{footer}</footer> : null}
        </div>
      </div>
    </div>
  );
}
