import { HistoryQaPanel } from "@/components/history-qa-panel";

interface QaPanelProps {
  project_id: number;
}

const suggested_questions = [
  "What should Student A finish before next week?",
  "What did the last meeting ask students to do next?",
  "Which branch appears to be converging into a milestone?",
];

export function QaPanel({ project_id }: QaPanelProps) {
  return (
    <HistoryQaPanel
      project_id={project_id}
      title="History QA"
      eyebrow="Project Recall"
      description="Ask about project history without manually rereading every meeting note. This panel must always show the source snippets behind an answer."
      accent_tone="advisor"
      label="Ask from project history"
      placeholder="What changed after the last group meeting?"
      empty_title="No question asked yet"
      empty_description="The first successful response here should make the project's historical memory feel searchable, not magical."
      insufficient_description="The system is explicitly choosing not to guess because project-local history did not provide enough evidence."
      suggested_questions={suggested_questions}
    />
  );
}
