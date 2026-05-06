"use client";

import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";

interface StudentProjectErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function StudentProjectError({
  error,
  reset,
}: StudentProjectErrorProps) {
  return (
    <AppShell
      personaTheme="student"
      eyebrow="Student Workspace"
      title="The personal branch workspace could not be assembled."
      description="This route should still fail gracefully, with a visible recovery path instead of collapsing into a blank page."
      badgeLabel="Error"
    >
      <SectionCard
        title="Workspace load failed"
        eyebrow="Error State"
        description="The page encountered an error while requesting student-facing project data."
      >
        <div className="space-y-4">
          <ErrorState
            title="Backend request failed"
            description={error.message || "An unknown error interrupted student workspace loading."}
          />
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--student-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </SectionCard>
    </AppShell>
  );
}
