import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { format_long_date } from "@/lib/format";
import type { UpdateResponse } from "@/lib/types/api";

interface UpdateTimelineProps {
  branch_title: string;
  updates: UpdateResponse[];
  is_loading?: boolean;
  error_message?: string;
}

export function UpdateTimeline({
  branch_title,
  updates,
  is_loading = false,
  error_message,
}: UpdateTimelineProps) {
  return (
    <SectionCard
      title="Update Timeline"
      eyebrow="Progress"
      description={branch_title}
      action={<StatusBadge label={`${updates.length} updates`} tone="student" />}
    >
      {is_loading ? (
        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 px-4 py-4 text-sm leading-6 muted-copy">
          Loading updates...
        </div>
      ) : error_message ? (
        <div className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-4 py-4 text-sm leading-6 text-[var(--warning)]">
          {error_message}
        </div>
      ) : updates.length === 0 ? (
        <EmptyState
          title="No updates yet"
          description="Submit the first update on this branch."
        />
      ) : (
        <div className="space-y-5">
          {updates.map((update, index) => (
            <article
              key={update.id}
              className="relative rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 p-5"
            >
              <div className="absolute left-5 top-5 hidden h-[calc(100%+1.5rem)] w-px bg-border-subtle md:block">
                {index === updates.length - 1 ? null : null}
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                    {format_long_date(update.created_at)}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    Update #{update.id}
                  </h3>
                </div>
                <StatusBadge
                  label={update.ai_status}
                  tone={update.ai_status === "completed" ? "success" : "warning"}
                />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div>
                    <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                      content
                    </p>
                    <p className="mt-2 text-sm leading-7 rich-copy">{update.content}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[var(--radius-sm)] bg-[var(--blocker-soft)] px-4 py-4">
                      <p className="mono-caption text-[0.64rem] text-[var(--blocker)]">
                        blocker
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--blocker)]">
                        {update.blockers ?? "No blocker recorded."}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--student-accent-soft)] px-4 py-4">
                      <p className="mono-caption text-[0.64rem] text-[var(--student-accent)]">
                        next step
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--student-accent)]">
                        {update.next_step ?? "No next step recorded."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 p-4">
                  <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                    ai summary
                  </p>
                  <p className="mt-3 text-sm leading-6 rich-copy">
                    {update.ai_summary ??
                      update.ai_error ??
                      "No AI summary is available for this update yet."}
                  </p>
                  {update.ai_status === "failed" ? (
                    <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-3 text-sm leading-6 text-[var(--warning)]">
                      AI summary failed, but the update was saved.
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
