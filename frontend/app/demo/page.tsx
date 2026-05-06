import { AppShell } from "@/components/app-shell";
import { PersonaCard } from "@/components/persona-card";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { DEMO_PERSONAS } from "@/lib/demo/config";
import { demoHighlights } from "@/lib/demo/mock";

export default function DemoPage() {
  return (
    <AppShell
      personaTheme="advisor"
      eyebrow="Git for Research"
      title="A research collaboration demo built around branch structure, meeting closure, and historical recall."
      description="This first frontend batch sets the product atmosphere and the role entry points. The goal is to make the demo feel like a real research workspace before we wire in the heavier data panels."
      badgeLabel="Demo Entry"
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Choose a demo workspace"
          eyebrow="Role Split"
          description="Skip login for the demo, but keep role boundaries visually explicit so the advisor and student experiences can diverge cleanly."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {DEMO_PERSONAS.map((persona) => (
              <PersonaCard key={persona.key} persona={persona} />
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="What this demo should prove"
          eyebrow="Value Lens"
          description="The product matters if it makes research coordination visible without forcing people to manually reconstruct context every week."
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
    </AppShell>
  );
}
