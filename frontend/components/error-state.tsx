import type { ReactNode } from "react";

interface ErrorStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div
      className="rounded-[var(--radius-sm)] px-5 py-6 text-sm"
      style={{
        border: "1px solid rgba(185, 72, 63, 0.25)",
        backgroundColor: "var(--blocker-soft)",
      }}
    >
      <p className="font-semibold text-[var(--blocker)]">{title}</p>
      <p className="mt-2 leading-6 text-[var(--blocker)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
