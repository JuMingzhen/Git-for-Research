import { AppShell } from "@/components/app-shell";
import { PersonaCard } from "@/components/persona-card";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { WorkspaceNav } from "@/components/workspace-nav";
import { DEMO_PERSONAS } from "@/lib/demo/config";
import { demoHighlights } from "@/lib/demo/mock";

export default function DemoPage() {
  return (
    <AppShell
      personaTheme="advisor"
      eyebrow="Git for Research"
      title="Choose a workspace"
      description="Open the advisor view or a student branch workspace."
      badgeLabel="Demo Entry"
      footer={<WorkspaceNav />}
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Workspaces"
          eyebrow="Role"
          description="Pick a role and enter."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {DEMO_PERSONAS.map((persona) => (
              <PersonaCard key={persona.key} persona={persona} />
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Why it matters"
          eyebrow="Value"
          description="The demo shows branch structure, meeting closure, and traceable history."
        >
          <div className="space-y-4">
            {demoHighlights.map((item, index) => (
              <article
                key={item.title}
                className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 p-4"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <StatusBadge label={`0${index + 1}`} tone="warning" />
                </div>
                <p className="text-sm leading-6 muted-copy">{item.description}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>
      <SectionCard
        title="Suggested flow"
        eyebrow="Demo"
        description="A short path that shows the full loop."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            "1. Open Advisor and scan the project graph, meetings, and tasks.",
            "2. Open Student A and show the current branch, updates, and task inbox.",
            "3. Return to Advisor and ask a history question with citations.",
          ].map((item, index) => (
            <article
              key={item}
              className="stagger-in rounded-[var(--radius-sm)] border border-border-subtle bg-white/52 p-4"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <p className="text-sm leading-6 rich-copy">{item}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
