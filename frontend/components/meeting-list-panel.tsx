import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { RefreshButton } from "@/components/refresh-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { format_long_date, truncate_text } from "@/lib/format";
import type { MeetingResponse } from "@/lib/types/api";

interface MeetingListPanelProps {
  meetings: MeetingResponse[];
  error_message?: string;
}

function meeting_tone(status: string) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed") {
    return "blocker" as const;
  }

  return "warning" as const;
}

export function MeetingListPanel({
  meetings,
  error_message,
}: MeetingListPanelProps) {
  return (
    <SectionCard
      title="Recent Meeting Cycle"
      eyebrow="Before & After"
      description="A compact view of where the meeting pipeline stands: briefing, summary, and whether tasks made it back into student branches."
    >
      {error_message ? (
        <ErrorState
          title="Meeting list unavailable"
          description={error_message}
          action={<RefreshButton label="Retry meeting fetch" tone="advisor" />}
        />
      ) : null}
      {!error_message && meetings.length === 0 ? (
        <EmptyState
          title="No meetings recorded"
          description="Once meetings are created, this panel will highlight the most recent coordination cycle."
        />
      ) : null}
      {!error_message && meetings.length > 0 ? (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{meeting.title}</h3>
                  <p className="text-sm leading-6 muted-copy">
                    {format_long_date(meeting.scheduled_at ?? meeting.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={`briefing ${meeting.briefing_status}`}
                    tone={meeting_tone(meeting.briefing_status)}
                  />
                  <StatusBadge
                    label={`summary ${meeting.summary_status}`}
                    tone={meeting_tone(meeting.summary_status)}
                  />
                  <StatusBadge
                    label={`tasks ${meeting.task_split_status}`}
                    tone={meeting_tone(meeting.task_split_status)}
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[var(--radius-sm)] bg-[var(--advisor-accent-soft)] p-4">
                  <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                    briefing
                  </p>
                  <p className="mt-3 text-sm leading-6 rich-copy">
                    {truncate_text(
                      meeting.ai_briefing ?? meeting.briefing_error ?? "No briefing output yet.",
                      180,
                    )}
                  </p>
                  {meeting.briefing_status === "failed" ? (
                    <div className="mt-4 ai-warning-note">
                      Briefing generation failed, but the meeting record itself is still visible.
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[var(--radius-sm)] bg-[var(--brass-soft)] p-4">
                  <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                    summary
                  </p>
                  <p className="mt-3 text-sm leading-6 rich-copy">
                    {truncate_text(
                      meeting.ai_summary ?? meeting.summary_error ?? "No summary output yet.",
                      180,
                    )}
                  </p>
                  {meeting.summary_status === "failed" ||
                  meeting.task_split_status === "failed" ? (
                    <div className="mt-4 ai-warning-note">
                      {meeting.task_split_status === "failed"
                        ? "Task split failed, so meeting decisions may not yet have returned to student inboxes."
                        : "Summary generation failed, but raw meeting data remains available through backend history."}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
