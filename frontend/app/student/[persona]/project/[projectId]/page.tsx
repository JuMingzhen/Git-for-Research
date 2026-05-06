import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { RouteSkeleton } from "@/components/route-skeleton";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getPersonaConfig } from "@/lib/demo/config";
import type { DemoPersona } from "@/lib/types/demo";

interface StudentProjectPageProps {
  params: Promise<{
    persona: string;
    projectId: string;
  }>;
}

const studentPersonas = new Set<DemoPersona>(["student-a", "student-b"]);

export default async function StudentProjectPage({
  params,
}: StudentProjectPageProps) {
  const { persona, projectId } = await params;

  if (!studentPersonas.has(persona as DemoPersona)) {
    notFound();
  }

  const config = getPersonaConfig(persona as DemoPersona);

  return (
    <AppShell
      personaTheme="student"
      eyebrow={`${config.label} Workspace · Project ${projectId}`}
      title="Personal research notebook shell for a student-facing branch workspace."
      description="This frame is reserved for the student's own research DAG, recent updates, task inbox, and progress composer. In batch 1 we keep the layout calm and legible before binding it to live data."
      badgeLabel="Student"
    >
      <SectionCard
        title="Batch 1 route placeholder"
        eyebrow="Scaffold Ready"
        description={config.summary}
        action={<StatusBadge label={config.label} tone="student" />}
      >
        <p className="text-sm leading-6 muted-copy">
          Persona route parameter received:{" "}
          <span className="font-mono text-foreground">{persona}</span>
          {" · "}
          Project: <span className="font-mono text-foreground">{projectId}</span>
        </p>
      </SectionCard>
      <RouteSkeleton
        roleLabel={config.label}
        roleSummary="Next, this page will become the personal branch view with merge milestones, recent updates, task inboxes, and a progress submission surface."
      />
    </AppShell>
  );
}
