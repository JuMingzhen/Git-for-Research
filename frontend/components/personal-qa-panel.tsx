import { HistoryQaPanel } from "@/components/history-qa-panel";

interface PersonalQaPanelProps {
  project_id: number;
  display_name: string;
}

export function PersonalQaPanel({
  project_id,
  display_name,
}: PersonalQaPanelProps) {
  return (
    <HistoryQaPanel
      project_id={project_id}
      title="Personal History QA"
      eyebrow="Notebook Recall"
      description="Ask about your recent nodes, meeting prompts, and recorded blockers."
      accent_tone="student"
      label="Ask from your history context"
      placeholder={`What did ${display_name} commit to after the last meeting?`}
      empty_title="No recall question yet"
      empty_description="Ask one question to search your project record."
      insufficient_description="The backend did not find enough project evidence to answer safely."
      suggested_questions={[
        `What did ${display_name} say the next step was?`,
        `What task was assigned to ${display_name} in the latest meeting?`,
        `What blocker has ${display_name} reported recently?`,
      ]}
    />
  );
}
