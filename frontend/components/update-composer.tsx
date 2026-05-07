"use client";

import { useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { create_update } from "@/lib/api/branches";
import type { UpdateResponse } from "@/lib/types/api";

interface UpdateComposerProps {
  branch_id: number;
  branch_title: string;
  author_id: number;
  display_name: string;
  on_update_created: (update: UpdateResponse) => void;
}

export function UpdateComposer({
  branch_id,
  branch_title,
  author_id,
  display_name,
  on_update_created,
}: UpdateComposerProps) {
  const [content, setContent] = useState("");
  const [blockers, setBlockers] = useState("");
  const [next_step, setNextStep] = useState("");
  const [success_message, setSuccessMessage] = useState<string | null>(null);
  const [error_message, setErrorMessage] = useState<string | null>(null);
  const [is_pending, startTransition] = useTransition();

  function reset_form() {
    setContent("");
    setBlockers("");
    setNextStep("");
  }

  function handle_submit() {
    if (!content.trim()) {
      setErrorMessage("Please write this update's main content before submitting.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const created = await create_update({
          branch_id,
          author_id,
          content: content.trim(),
          blockers: blockers.trim() ? blockers.trim() : null,
          next_step: next_step.trim() ? next_step.trim() : null,
        });
        on_update_created(created);
        reset_form();
        setSuccessMessage(`${display_name}'s update was saved.`);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("This update could not be submitted right now.");
        }
      }
    });
  }

  return (
    <SectionCard
      title="Submit Update"
      eyebrow="Current Branch"
      description={branch_title}
      action={<StatusBadge label={`#${branch_id}`} tone="student" />}
    >
      {error_message ? (
        <div className="mb-4">
          <ErrorState title="Update submission failed" description={error_message} />
        </div>
      ) : null}
      {success_message ? (
        <div className="mb-4 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-4 text-sm leading-6 text-[var(--success)]">
          {success_message}
        </div>
      ) : null}
      <div className="grid gap-4">
        <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/56 px-4 py-3 text-sm leading-6 muted-copy">
          Current branch: <span className="font-semibold text-foreground">{branch_title}</span>
        </div>
        <div>
          <label
            htmlFor="update-content"
            className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
          >
            milestone content
          </label>
          <textarea
            id="update-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What did you actually finish, test, or decide?"
            className="mt-2 min-h-36 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="update-blockers"
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              blocker
            </label>
            <textarea
              id="update-blockers"
              value={blockers}
              onChange={(event) => setBlockers(event.target.value)}
              placeholder="What is slowing this branch down?"
              className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="update-next-step"
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              next step
            </label>
            <textarea
              id="update-next-step"
              value={next_step}
              onChange={(event) => setNextStep(event.target.value)}
              placeholder="What should happen next on this branch?"
              className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--student-accent)]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handle_submit}
            disabled={is_pending}
            className="rounded-full bg-[var(--student-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {is_pending ? "Submitting..." : "Submit update"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
