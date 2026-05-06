"use client";

import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";

interface AdvisorProjectErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function AdvisorProjectError({
  error,
  reset,
}: AdvisorProjectErrorProps) {
  return (
    <AppShell
      personaTheme="advisor"
      eyebrow="Advisor Workspace"
      title="The advisor command room could not be assembled."
      description="This route should still fail gracefully, with a visible error state instead of a broken screen."
      badgeLabel="Error"
    >
      <SectionCard
        title="Project load failed"
        eyebrow="Error State"
        description="The page encountered an error while requesting project data."
      >
        <div className="space-y-4">
          <ErrorState
            title="Backend request failed"
            description={error.message || "An unknown error interrupted project loading."}
          />
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--advisor-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </SectionCard>
    </AppShell>
  );
}
