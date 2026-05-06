import { AppShell } from "@/components/app-shell";
import { LoadingBlock } from "@/components/loading-block";
import { SectionCard } from "@/components/section-card";

export default function StudentProjectLoading() {
  return (
    <AppShell
      personaTheme="student"
      eyebrow="Student Workspace"
      title="Preparing the personal research notebook."
      description="Loading the branch graph, update history, meeting inbox, and personal recall panels."
      badgeLabel="Loading"
    >
      <SectionCard
        title="Loading student workspace"
        eyebrow="Please Wait"
        description="The student route assembles one personal branch view from several backend endpoints."
      >
        <LoadingBlock label="Gathering branch detail, updates, meeting tasks, and project context." />
      </SectionCard>
    </AppShell>
  );
}
