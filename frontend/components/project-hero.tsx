import { StatusBadge } from "@/components/status-badge";
import type { LineResponse, ProgressNodeResponse, ProjectResponse } from "@/lib/types/api";

interface ProjectHeroProps {
  project: ProjectResponse;
  lines: LineResponse[];
  nodes: ProgressNodeResponse[];
}

export function ProjectHero({ project, lines, nodes }: ProjectHeroProps) {
  const main_line = lines.find((line) => line.id === project.main_line_id);
  const student_lines = lines.filter((line) => line.line_type === "personal");
  const merge_nodes = nodes.filter((node) => node.node_kind === "merge");

  return (
    <section className="paper-panel rounded-[var(--radius-lg)] p-6 md:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">Project</p>
              <h2 className="display-title text-4xl font-medium leading-tight text-foreground md:text-5xl">
                {project.title}
              </h2>
            </div>
            <StatusBadge label={project.status} tone="advisor" />
          </div>
          <p className="max-w-3xl text-base leading-7 rich-copy md:text-lg">
            {project.description ?? "This project is currently running without a written description."}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Main line</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {main_line?.title ?? "Main Line"}
              </p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                Shared spine for the project graph.
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                Student lines
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{student_lines.length}</p>
              <p className="mt-2 text-sm leading-6 muted-copy">Personal lines currently active.</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4">
              <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">Merge nodes</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{merge_nodes.length}</p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                Milestones where split work reconverged.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(31,74,60,0.1),rgba(184,138,71,0.06))] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="mono-caption text-[0.72rem] text-[var(--ink-muted)]">Advisor View</p>
            <StatusBadge label="war room" tone="warning" />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 rich-copy">
            <p>Scan the project graph, the latest meeting cycle, and the open task prompts in one place.</p>
            <p>The point is fast orientation: what moved, what merged, and what still needs follow-up.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
