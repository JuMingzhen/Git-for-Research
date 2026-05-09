import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { format_long_date } from "@/lib/format";
import type { ProgressNodeResponse } from "@/lib/types/api";

interface UpdateTimelineProps {
  line_title: string;
  nodes: ProgressNodeResponse[];
  selected_node_id: number | null;
  is_loading?: boolean;
  error_message?: string;
  on_select_node: (node_id: number) => void;
}

export function UpdateTimeline({
  line_title,
  nodes,
  selected_node_id,
  is_loading = false,
  error_message,
  on_select_node,
}: UpdateTimelineProps) {
  return (
    <SectionCard
      title="Node History"
      eyebrow="Progress"
      description={line_title}
      action={<StatusBadge label={`${nodes.length} nodes`} tone="student" />}
    >
      {is_loading ? (
        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 px-4 py-4 text-sm leading-6 muted-copy">
          Loading node history...
        </div>
      ) : error_message ? (
        <div className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-4 py-4 text-sm leading-6 text-[var(--warning)]">
          {error_message}
        </div>
      ) : nodes.length === 0 ? (
        <EmptyState
          title="No nodes yet"
          description="Submit the first update on this line."
        />
      ) : (
        <div className="space-y-5">
          {nodes.map((node) => {
            const is_selected = node.id === selected_node_id;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => on_select_node(node.id)}
                className={[
                  "w-full rounded-[var(--radius-sm)] border p-5 text-left transition",
                  is_selected
                    ? "border-transparent bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]"
                    : "border-border-subtle bg-white/56 hover:bg-white/72",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                      {format_long_date(node.created_at)}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">{node.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={node.node_kind} tone="success" />
                    <StatusBadge
                      label={node.ai_status}
                      tone={node.ai_status === "completed" ? "success" : "warning"}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                        content
                      </p>
                      <p className="mt-2 text-sm leading-7 rich-copy">{node.content}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[var(--radius-sm)] bg-[var(--blocker-soft)] px-4 py-4">
                        <p className="mono-caption text-[0.64rem] text-[var(--blocker)]">
                          blocker
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--blocker)]">
                          {node.blockers ?? "No blocker recorded."}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-sm)] bg-[var(--student-accent-soft)] px-4 py-4">
                        <p className="mono-caption text-[0.64rem] text-[var(--student-accent)]">
                          next step
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--student-accent)]">
                          {node.next_step ?? "No next step recorded."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 p-4">
                      <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                        ai summary
                      </p>
                      <p className="mt-3 text-sm leading-6 rich-copy">
                        {node.ai_summary ??
                          node.ai_error ??
                          "No AI summary is available for this node yet."}
                      </p>
                      {node.ai_status === "failed" ? (
                        <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-3 text-sm leading-6 text-[var(--warning)]">
                          AI summary failed, but the node was saved.
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/72 p-4">
                      <p className="mono-caption text-[0.64rem] text-[var(--ink-muted)]">
                        parent nodes
                      </p>
                      <p className="mt-3 text-sm leading-6 rich-copy">
                        {node.parent_node_ids.length > 0
                          ? node.parent_node_ids.join(", ")
                          : "No parents recorded."}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
