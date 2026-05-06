import { EmptyState } from "@/components/empty-state";
import { LoadingBlock } from "@/components/loading-block";
import { SectionCard } from "@/components/section-card";

interface RouteSkeletonProps {
  roleLabel: string;
  roleSummary: string;
}

export function RouteSkeleton({
  roleLabel,
  roleSummary,
}: RouteSkeletonProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <SectionCard
        title={`${roleLabel} command surface`}
        eyebrow="Page Skeleton"
        description={roleSummary}
      >
        <LoadingBlock label="Primary research view will land in batch 2 or 3." />
      </SectionCard>
      <div className="grid gap-6">
        <SectionCard
          title="Planned panels"
          eyebrow="Coming Next"
          description="These slots are reserved so the layout can stabilize before data-heavy implementation begins."
        >
          <div className="space-y-4">
            <EmptyState
              title="Data panels pending"
              description="Branch graphs, recent meetings, task inboxes, and QA panels will attach to the frozen backend contract in later batches."
            />
            <EmptyState
              title="Visual system already active"
              description="This page is intentionally styled now so we can judge the demo atmosphere before wiring business logic."
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
