import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  eyebrow,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={[
        "paper-panel rounded-[var(--radius-md)] p-6 soft-fade-in",
        className ?? "",
      ].join(" ")}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h2 className="display-title text-2xl font-medium text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 rich-copy">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
