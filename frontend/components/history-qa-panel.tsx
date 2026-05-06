"use client";

import { useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { LoadingBlock } from "@/components/loading-block";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api/client";
import { ask_project_qa } from "@/lib/api/projects";
import type { QaResponse } from "@/lib/types/api";

interface HistoryQaPanelProps {
  project_id: number;
  title: string;
  eyebrow: string;
  description: string;
  accent_tone: "advisor" | "student";
  label: string;
  placeholder: string;
  empty_title: string;
  empty_description: string;
  insufficient_description: string;
  suggested_questions: string[];
}

export function HistoryQaPanel({
  project_id,
  title,
  eyebrow,
  description,
  accent_tone,
  label,
  placeholder,
  empty_title,
  empty_description,
  insufficient_description,
  suggested_questions,
}: HistoryQaPanelProps) {
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
      title={title}
      eyebrow={eyebrow}
      description={description}
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-white/58 p-4">
            <label
              htmlFor={`history-qa-question-${project_id}-${eyebrow}`}
              className="mono-caption text-[0.68rem] text-[var(--ink-muted)]"
            >
              {label}
            </label>
            <textarea
              id={`history-qa-question-${project_id}-${eyebrow}`}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={placeholder}
              className={[
                "mt-3 min-h-32 w-full resize-y rounded-[var(--radius-sm)] border border-border-subtle bg-white/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition",
                accent_tone === "advisor"
                  ? "focus:border-[var(--advisor-accent)]"
                  : "focus:border-[var(--student-accent)]",
              ].join(" ")}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => submit_question(question)}
                disabled={is_pending}
                className={[
                  "rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65",
                  accent_tone === "advisor"
                    ? "bg-[var(--advisor-accent)]"
                    : "bg-[var(--student-accent)]",
                ].join(" ")}
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
              <p className="font-semibold text-foreground">{empty_title}</p>
              <p className="mt-2 text-sm leading-6 muted-copy">
                {empty_description}
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
                  {insufficient_description}
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
                      <blockquote
                        className={[
                          "border-l-2 pl-3 text-sm leading-6 rich-copy",
                          accent_tone === "advisor"
                            ? "border-[var(--advisor-accent)]"
                            : "border-[var(--student-accent)]",
                        ].join(" ")}
                      >
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
