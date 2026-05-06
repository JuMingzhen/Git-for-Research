import { AppShell } from "@/components/app-shell";
import { LoadingBlock } from "@/components/loading-block";
import { SectionCard } from "@/components/section-card";

export default function AdvisorProjectLoading() {
  return (
    <AppShell
      personaTheme="advisor"
      eyebrow="Advisor Workspace"
      title="Preparing the advisor command room."
      description="Loading the project spine, meeting cycle, task reflux, and historical recall panels."
      badgeLabel="Loading"
    >
      <SectionCard
        title="Loading project overview"
        eyebrow="Please Wait"
        description="The advisor page assembles several project-wide panels at once."
      >
        <LoadingBlock label="Gathering branches, meetings, tasks, and history context." />
      </SectionCard>
    </AppShell>
  );
}
