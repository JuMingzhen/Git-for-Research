import { HistoryQaPanel } from "@/components/history-qa-panel";

interface QaPanelProps {
  project_id: number;
}

const suggested_questions = [
  "What should Student A finish before next week?",
  "What did the last meeting ask students to do next?",
  "Which lines already converged into a milestone?",
];

export function QaPanel({ project_id }: QaPanelProps) {
  return (
    <HistoryQaPanel
      project_id={project_id}
      title="History QA"
      eyebrow="Project Recall"
      description="Ask about project history and keep the citations visible."
      accent_tone="advisor"
      label="Ask from project history"
      placeholder="What changed after the last group meeting?"
      empty_title="No question asked yet"
      empty_description="Ask one question to search the project record."
      insufficient_description="The system did not find enough project evidence to answer safely."
      suggested_questions={suggested_questions}
    />
  );
}
