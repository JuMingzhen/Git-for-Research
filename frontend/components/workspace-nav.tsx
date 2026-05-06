import Link from "next/link";

import { DEMO_PERSONAS } from "@/lib/demo/config";
import type { DemoPersona } from "@/lib/types/demo";

interface WorkspaceNavProps {
  current_persona?: DemoPersona;
}

export function WorkspaceNav({ current_persona }: WorkspaceNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/demo"
        className="rounded-full border border-border-subtle bg-white/58 px-3.5 py-2 text-sm font-medium transition hover:border-border-strong hover:bg-white/80"
      >
        Demo entry
      </Link>
      {DEMO_PERSONAS.map((persona) => {
        const is_current = persona.key === current_persona;

        return (
          <Link
            key={persona.key}
            href={persona.href}
            className={[
              "rounded-full border px-3.5 py-2 text-sm font-medium transition",
              is_current
                ? persona.theme === "advisor"
                  ? "border-transparent bg-[var(--advisor-accent)] text-white"
                  : "border-transparent bg-[var(--student-accent)] text-white"
                : "border-border-subtle bg-white/58 hover:border-border-strong hover:bg-white/80",
            ].join(" ")}
          >
            {persona.label}
          </Link>
        );
      })}
    </div>
  );
}
