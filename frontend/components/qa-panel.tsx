"use client";

import { useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { LoadingBlock } from "@/components/loading-block";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { ask_project_qa } from "@/lib/api/projects";
import type { QaResponse } from "@/lib/types/api";

interface QaPanelProps {
  project_id: number;
}

const suggested_questions = [
  "What should Student A finish before next week?",
  "What did the last meeting ask students to do next?",
  "Which branch appears to be converging into a milestone?",
];

export function QaPanel({ project_id }: QaPanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QaResponse | null>(null);
  const [error_message, setErrorMessage] = useState<string | null>(null);
  const [is_pending, startTransition] = useTransition();

  function submit_question(next_question: string) {
    const trimmed_question = next_question.trim();
    if (!trimmed_question) {
      setErrorMessage("Please enter a history question before asking.");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await ask_project_qa({
          project_id,
          question: trimmed_question,
        });
        setResult(response);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
          return;
        }

        setErrorMessage("The QA panel could not reach backend history right now.");
      }
    });
  }

  return (
    <SectionCard
      title="History QA"
      eyebrow="Project Recall"
      description="Ask about project history without manually rereading every meeting note. This panel must always show the source snippets behind an answer."
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-4">
            <label
              htmlFor="advisor-qa-question"
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              Ask from project history
            </label>
            <textarea
              id="advisor-qa-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What changed after the last group meeting?"
              className="mt-3 min-h-32 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[var(--advisor-accent)]"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => submit_question(question)}
                disabled={is_pending}
                className="rounded-full bg-[var(--advisor-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {is_pending ? "Asking..." : "Ask history"}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {suggested_questions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuestion(item);
                  submit_question(item);
                }}
                className="block w-full rounded-[var(--radius-sm)] border border-border-subtle bg-white/50 px-4 py-3 text-left text-sm leading-6 transition hover:border-border-strong hover:bg-white/72"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {is_pending ? (
            <LoadingBlock label="Searching project-local history and citations." />
          ) : null}
          {error_message ? (
            <ErrorState title="QA request failed" description={error_message} />
          ) : null}
          {!is_pending && !error_message && !result ? (
            <div className="rounded-[var(--radius-sm)] border border-dashed border-border-strong bg-white/40 px-5 py-6">
              <p className="font-semibold text-foreground">No question asked yet</p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                The first successful response here should make the project&apos;s historical
                memory feel searchable, not magical.
              </p>
            </div>
          ) : null}
          {result ? (
            <div className="space-y-4 rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">QA result</h3>
                <StatusBadge
                  label={result.status}
                  tone={result.status === "answered" ? "success" : "warning"}
                />
              </div>
              <p className="text-sm leading-7 rich-copy">{result.answer}</p>
              {result.status === "insufficient_information" ? (
                <div className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-4 py-4 text-sm leading-6 text-[var(--warning)]">
                  The system is explicitly choosing not to guess because project-local
                  history did not provide enough evidence.
                </div>
              ) : null}
              {result.citations.length > 0 ? (
                <div className="space-y-3">
                  <p className="mono-caption text-[0.68rem] text-[var(--ink-muted)]">
                    Citations
                  </p>
                  {result.citations.map((citation) => (
                    <article
                      key={`${citation.source_type}-${citation.source_id}-${citation.snippet}`}
                      className="rounded-[var(--radius-sm)] border border-border-subtle bg-[var(--surface-muted)] px-4 py-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge label={citation.source_type} tone="neutral" />
                        <span className="font-mono text-xs text-[var(--ink-muted)]">
                          source #{citation.source_id}
                        </span>
                      </div>
                      <blockquote className="border-l-2 border-[var(--advisor-accent)] pl-3 text-sm leading-6 rich-copy">
                        {citation.snippet}
                      </blockquote>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
