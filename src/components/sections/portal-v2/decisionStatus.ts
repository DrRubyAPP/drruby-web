import type { DecisionLifecycle } from "@/components/sections/portal/decisions/dto";

/** Human-readable status for the decision lifecycle shown in Portal v2. */
const DECISION_STATUS_LABELS: Record<DecisionLifecycle, string> = {
  ACTIVE: "considering",
  DECIDED: "ongoing",
  OBSERVING: "ongoing",
  LEARNING: "ongoing",
  CLOSED: "give up",
  COMPLETED: "finished",
};

export function decisionStatusLabel(lifecycle: DecisionLifecycle): string {
  return DECISION_STATUS_LABELS[lifecycle];
}
