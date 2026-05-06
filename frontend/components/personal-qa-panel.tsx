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
      description="Use project memory as a personal recall surface: revisit what your track committed to, what meetings asked from you, and where evidence was recorded."
      accent_tone="student"
      label="Ask from your history context"
      placeholder={`What did ${display_name} commit to after the last meeting?`}
      empty_title="No recall question yet"
      empty_description="This panel is meant to feel like a searchable notebook margin for your branch history, not a black box."
      insufficient_description="The backend did not find enough project-local evidence to answer safely, so it is surfacing uncertainty instead of inventing a memory."
      suggested_questions={[
        `What did ${display_name} say the next step was?`,
        `What task was assigned to ${display_name} in the latest meeting?`,
        `What blocker has ${display_name} reported recently?`,
      ]}
    />
  );
}
