export interface DecisionTimelineContext {
  topic: string | null;
  question: string;
  observeBaseline?: unknown;
}

function baselineText(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const text = (value as { text?: unknown }).text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function withDecision(
  action: string,
  decision?: DecisionTimelineContext | null,
) {
  const topic = decision?.topic?.trim();
  if (topic) return `${action} ${topic}`;
  const question = decision?.question.trim();
  return question ? `${action}: ${question}` : action;
}

function withObservation(
  action: string,
  decision?: DecisionTimelineContext | null,
) {
  const baseline = baselineText(decision?.observeBaseline);
  return baseline ? `${action} ${baseline}` : withDecision(action, decision);
}

export function describeObservationAction(
  action: string,
  decision?: DecisionTimelineContext | null,
): string {
  return withObservation(action, decision);
}

/** Add context to old generic rows without changing the stored audit event. */
export function describeTimelineTitle(
  title: string,
  decision?: DecisionTimelineContext | null,
): string {
  switch (title) {
    case "Started observing":
      return withObservation("Started observing", decision);
    case "Stopped observing":
      return withObservation("Stopped observing", decision);
    case "Marked as completed":
    case "Completed":
      return withDecision("Completed", decision);
    default:
      return title;
  }
}

export function describeDecisionOutcome(
  outcome: string,
  decision: DecisionTimelineContext,
): string {
  const action: Record<string, string> = {
    decided_to_do_it: "Decided to start",
    decided_not_to: "Decided not to pursue",
    talk_with_clinician_first: "Decided to ask a clinician about",
    keep_exploring: "Chose to keep exploring",
    discuss_with_clinician: "Decided to discuss",
    come_back_later: "Decided to revisit",
    decided_on_next_step: "Decided on a next step for",
    still_considering: "Still considering",
  };
  return withDecision(action[outcome] ?? "Updated decision about", decision);
}
