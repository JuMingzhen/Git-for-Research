interface LoadingBlockProps {
  label?: string;
}

export function LoadingBlock({
  label = "Preparing this panel for the next batch.",
}: LoadingBlockProps) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/55 px-5 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 animate-pulse rounded-full"
          style={{ backgroundColor: "var(--persona-accent)" }}
        />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <div className="space-y-3">
        <div
          className="h-3 rounded-full"
          style={{ backgroundColor: "var(--persona-accent-soft)" }}
        />
        <div
          className="h-3 w-4/5 rounded-full opacity-80"
          style={{ backgroundColor: "var(--persona-accent-soft)" }}
        />
        <div
          className="h-3 w-2/3 rounded-full opacity-65"
          style={{ backgroundColor: "var(--persona-accent-soft)" }}
        />
      </div>
    </div>
  );
}
