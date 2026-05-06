"use client";

import { useRouter } from "next/navigation";

interface RefreshButtonProps {
  label?: string;
  tone?: "advisor" | "student" | "neutral";
}

export function RefreshButton({
  label = "Retry fetch",
  tone = "neutral",
}: RefreshButtonProps) {
  const router = useRouter();

  const tone_class =
    tone === "advisor"
      ? "border-[var(--advisor-accent)]/30 bg-[var(--advisor-accent-soft)] text-[var(--advisor-accent)]"
      : tone === "student"
        ? "border-[var(--student-accent)]/30 bg-[var(--student-accent-soft)] text-[var(--student-accent)]"
        : "border-border-subtle bg-white/72 text-foreground";

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={[
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition hover:brightness-105",
        tone_class,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
