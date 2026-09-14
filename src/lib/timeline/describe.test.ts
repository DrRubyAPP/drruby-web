import { describe, expect, it } from "vitest";
import {
  describeDecisionOutcome,
  describeObservationAction,
  describeTimelineTitle,
} from "@/lib/timeline/describe";

describe("timeline activity descriptions", () => {
  const thermage = {
    topic: "Thermage",
    question: "Should I try Thermage?",
    observeBaseline: { text: "skin condition", freq: "weekly" },
  };

  it("adds the observation target to old generic events", () => {
    expect(describeTimelineTitle("Started observing", thermage)).toBe(
      "Started observing skin condition",
    );
    expect(describeTimelineTitle("Stopped observing", thermage)).toBe(
      "Stopped observing skin condition",
    );
  });

  it("uses the decision topic when a completed observation has lost its baseline", () => {
    expect(
      describeTimelineTitle("Marked as completed", {
        ...thermage,
        observeBaseline: null,
      }),
    ).toBe("Completed Thermage");
    expect(describeTimelineTitle("Completed", thermage)).toBe(
      "Completed Thermage",
    );
  });

  it("keeps user-written titles and describes new decisions", () => {
    expect(describeTimelineTitle("Started HRT", thermage)).toBe("Started HRT");
    expect(describeDecisionOutcome("decided_to_do_it", thermage)).toBe(
      "Decided to start Thermage",
    );
    expect(describeDecisionOutcome("decided_not_to", thermage)).toBe(
      "Decided not to pursue Thermage",
    );
  });

  it("names an observation check-in by its target", () => {
    expect(
      describeObservationAction("Recorded observation for", thermage),
    ).toBe("Recorded observation for skin condition");
  });
});
