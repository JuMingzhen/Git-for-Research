interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-dashed border-border-strong bg-white/45 px-5 py-6 text-sm">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 leading-6 muted-copy">{description}</p>
    </div>
  );
}
