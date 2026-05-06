interface StatusBadgeProps {
  label: string;
  tone?: "neutral" | "advisor" | "student" | "success" | "warning" | "blocker";
}

const toneClassMap: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-border-subtle bg-white/70 text-foreground/70",
  advisor: "border-transparent bg-advisor-accent/12 text-advisor-accent",
  student: "border-transparent bg-student-accent/12 text-student-accent",
  success: "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  warning: "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  blocker: "border-transparent bg-[var(--blocker-soft)] text-blocker",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.14em] uppercase",
        toneClassMap[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
