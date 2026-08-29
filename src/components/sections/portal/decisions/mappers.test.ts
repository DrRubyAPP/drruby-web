import { describe, expect, it } from "vitest";
import type { DecisionDetailDto, DecisionDto } from "./dto";
import {
  ALL_DECISION_TYPES,
  archivedEntryLabel,
  buildEntryText,
  chipToQuestionTemplate,
  chipToTopic,
  DECISION_CHIPS,
  deriveHomeState,
  feelObserveToQuestion,
  GOAL_OPTIONS,
  goalToLabel,
  groupDecisions,
  isActionable,
  KIND_OPTIONS,
  lifecycleToLabel,
  mapBrief,
  mapDecisionDetail,
  outcomesForKind,
  outcomeToLabel,
  skinConsiderToQuestion,
  sortEntries,
  stackConsiderToQuestion,
  topicSlugToLabel,
  typeToLabel,
} from "./mappers";

describe("lifecycleToLabel", () => {
  it("maps 6 lifecycles to badge labels", () => {
    expect(lifecycleToLabel("ACTIVE")).toBe("Active");
    expect(lifecycleToLabel("DECIDED")).toBe("Decided");
    expect(lifecycleToLabel("OBSERVING")).toBe("Observing");
    expect(lifecycleToLabel("LEARNING")).toBe("Learning");
    expect(lifecycleToLabel("COMPLETED")).toBe("Completed");
    expect(lifecycleToLabel("CLOSED")).toBe("Closed");
  });
});

describe("isActionable", () => {
  it("returns true unless lifecycle is CLOSED or COMPLETED (§6)", () => {
    expect(isActionable("ACTIVE")).toBe(true);
    expect(isActionable("DECIDED")).toBe(true);
    expect(isActionable("OBSERVING")).toBe(true);
    expect(isActionable("LEARNING")).toBe(true);
    expect(isActionable("COMPLETED")).toBe(false);
    expect(isActionable("CLOSED")).toBe(false);
  });
});

describe("groupDecisions", () => {
  const mkDecision = (
    id: string,
    lifecycle: DecisionDto["lifecycle"],
  ): DecisionDto => ({
    id,
    question: `q-${id}`,
    goal: null,
    type: null,
    topic: null,
    topicSlug: null,
    lifecycle,
    decisionKind: "unconfirmed",
    outcome: null,
    nextStep: null,
    saved: true,
    yourselfContext: null,
    updated: "2026-08-10T00:00:00.000Z",
    lastUserActivityAt: "2026-08-10T00:00:00.000Z",
  });

  it("empty array → both groups empty", () => {
    expect(groupDecisions([])).toEqual({ actionable: [], history: [] });
  });

  it("splits mixed list into actionable and history preserving order", () => {
    const items = [
      mkDecision("a1", "ACTIVE"),
      mkDecision("h1", "CLOSED"),
      mkDecision("a2", "DECIDED"),
      mkDecision("h2", "COMPLETED"),
      mkDecision("a3", "OBSERVING"),
    ];
    expect(groupDecisions(items)).toEqual({
      actionable: [
        mkDecision("a1", "ACTIVE"),
        mkDecision("a2", "DECIDED"),
        mkDecision("a3", "OBSERVING"),
      ],
      history: [mkDecision("h1", "CLOSED"), mkDecision("h2", "COMPLETED")],
    });
  });

  it("all closed/completed → actionable empty", () => {
    const items = [mkDecision("h1", "CLOSED"), mkDecision("h2", "COMPLETED")];
    expect(groupDecisions(items).actionable).toEqual([]);
  });

  it("all actionable → history empty", () => {
    const items = [mkDecision("a1", "ACTIVE"), mkDecision("a2", "LEARNING")];
    expect(groupDecisions(items).history).toEqual([]);
  });
});

describe("mapBrief", () => {
  const fullBrief = {
    yourHistory: ["history 1"],
    similarJourneys: { summary: "summary", note: "note" },
    evidence: { known: ["k1"], uncertain: ["u1"] },
    questionsForClinician: ["q1"],
  };

  it("null → null (整块隐藏)", () => {
    expect(mapBrief(null)).toBeNull();
    expect(mapBrief(undefined)).toBeNull();
  });

  it("full brief → BriefView with all hasXxx = true", () => {
    const view = mapBrief(fullBrief);
    expect(view?.hasYourHistory).toBe(true);
    expect(view?.hasSimilarJourneys).toBe(true);
    expect(view?.hasEvidence).toBe(true);
    expect(view?.hasQuestions).toBe(true);
    expect(view?.yourHistory).toEqual(["history 1"]);
    expect(view?.evidenceKnown).toEqual(["k1"]);
    expect(view?.evidenceUncertain).toEqual(["u1"]);
    expect(view?.questionsForClinician).toEqual(["q1"]);
  });

  it("empty arrays/strings → hasXxx = false (degraded render)", () => {
    const view = mapBrief({
      yourHistory: [],
      similarJourneys: { summary: "", note: "" },
      evidence: { known: [], uncertain: [] },
      questionsForClinician: [],
    });
    expect(view).not.toBeNull();
    expect(view?.hasYourHistory).toBe(false);
    expect(view?.hasSimilarJourneys).toBe(false);
    expect(view?.hasEvidence).toBe(false);
    expect(view?.hasQuestions).toBe(false);
  });

  it("whitespace-only strings → hasXxx = false", () => {
    const view = mapBrief({
      ...fullBrief,
      similarJourneys: { summary: "   ", note: " " },
    });
    expect(view?.hasSimilarJourneys).toBe(false);
    expect(view?.hasYourHistory).toBe(true); // 不受影响
  });
});

describe("sortEntries", () => {
  const mk = (id: string, ts: string) => ({
    id,
    text: `t-${id}`,
    lifecycleSnapshot: "ACTIVE" as const,
    occurredAt: ts,
  });

  it("sorts ascending by occurredAt (old → new)", () => {
    const entries = [
      mk("e3", "2026-08-10T10:00:00.000Z"),
      mk("e1", "2026-08-01T08:00:00.000Z"),
      mk("e2", "2026-08-05T12:00:00.000Z"),
    ];
    expect(sortEntries(entries).map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("preserves original array (immutable)", () => {
    const entries = [
      mk("e2", "2026-08-10T00:00:00.000Z"),
      mk("e1", "2026-08-01T00:00:00.000Z"),
    ];
    const sorted = sortEntries(entries);
    expect(entries.map((e) => e.id)).toEqual(["e2", "e1"]); // 原数组不变
    expect(sorted.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("empty array → empty array", () => {
    expect(sortEntries([])).toEqual([]);
  });
});

describe("mapDecisionDetail", () => {
  const detail: DecisionDetailDto = {
    id: "d1",
    question: "Should I do Thermage?",
    goal: "firmness",
    type: "procedure",
    topic: "Thermage",
    topicSlug: "thermage",
    lifecycle: "ACTIVE",
    decisionKind: "unconfirmed",
    outcome: null,
    nextStep: null,
    saved: true,
    yourselfContext: "some context",
    updated: "2026-08-10T00:00:00.000Z",
    lastUserActivityAt: "2026-08-10T00:00:00.000Z",
    brief: {
      yourHistory: ["h1"],
      similarJourneys: { summary: "s", note: "n" },
      evidence: { known: ["k"], uncertain: ["u"] },
      questionsForClinician: ["q"],
    },
    entries: [
      {
        id: "e2",
        text: "second",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: "2026-08-05T00:00:00.000Z",
      },
      {
        id: "e1",
        text: "first",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: "2026-08-01T00:00:00.000Z",
      },
    ],
  };

  it("merges question + lifecycleLabel + sorted entries + brief", () => {
    const view = mapDecisionDetail(detail);
    expect(view.id).toBe("d1");
    expect(view.question).toBe("Should I do Thermage?");
    expect(view.goal).toBe("firmness");
    expect(view.lifecycle).toBe("ACTIVE");
    expect(view.lifecycleLabel).toBe("Active");
    expect(view.entries.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(view.brief?.hasYourHistory).toBe(true);
  });

  it("null brief → brief=null (整块隐藏)", () => {
    const view = mapDecisionDetail({ ...detail, brief: undefined });
    expect(view.brief).toBeNull();
  });

  it("null goal → goal=null (旧数据)", () => {
    const view = mapDecisionDetail({ ...detail, goal: null });
    expect(view.goal).toBeNull();
  });
});

describe("chip mappers", () => {
  it("DECISION_CHIPS lists 8 topic chips in stable order", () => {
    expect(DECISION_CHIPS).toEqual([
      "Thermage",
      "Ultherapy",
      "Botox",
      "Laser",
      "Filler",
      "HRT",
      "A skincare product",
      "A doctor or clinic",
    ]);
    expect(DECISION_CHIPS).toHaveLength(8);
  });

  it("chipToTopic maps each chip to { topic, topicSlug, type } 三元组", () => {
    expect(chipToTopic("Thermage")).toEqual({
      topic: "Thermage",
      topicSlug: "thermage",
      type: "procedure",
    });
    expect(chipToTopic("HRT")).toEqual({
      topic: "HRT",
      topicSlug: "hrt",
      type: "medication",
    });
    expect(chipToTopic("A skincare product")).toEqual({
      topic: "Skincare",
      topicSlug: "skincare",
      type: "product",
    });
    expect(chipToTopic("A doctor or clinic")).toEqual({
      topic: "Clinic",
      topicSlug: "clinic",
      type: "not_sure",
    });
  });

  it("chipToTopic returns undefined for unknown chip", () => {
    expect(chipToTopic("Not a chip")).toBeUndefined();
  });

  it("chipToQuestionTemplate wraps chip in 'Should I do X?'", () => {
    expect(chipToQuestionTemplate("Thermage")).toBe("Should I do Thermage?");
    expect(chipToQuestionTemplate("A skincare product")).toBe(
      "Should I do A skincare product?",
    );
  });
});

describe("goal mappers", () => {
  it("GOAL_OPTIONS lists preset goal keys in stable order", () => {
    expect(GOAL_OPTIONS).toEqual([
      "firmness",
      "even-tone",
      "acne",
      "sleep-quality",
      "energy",
      "mood",
      "hot-flashes",
    ]);
  });

  it("goalToLabel maps known goal keys to labels", () => {
    expect(goalToLabel("firmness")).toBe("Firmer skin");
    expect(goalToLabel("sleep-quality")).toBe("Better sleep");
    expect(goalToLabel("mood")).toBe("Balanced mood");
  });

  it("goalToLabel humanizes unknown/custom goals", () => {
    expect(goalToLabel("skin")).toBe("Skin");
    expect(goalToLabel("supplements")).toBe("Supplements");
  });
});

describe("type mappers", () => {
  it("ALL_DECISION_TYPES lists 8 coarse types in stable order", () => {
    expect(ALL_DECISION_TYPES).toEqual([
      "procedure",
      "medication",
      "treatment",
      "test",
      "supplement",
      "lifestyle",
      "product",
      "not_sure",
    ]);
    expect(ALL_DECISION_TYPES).toHaveLength(8);
  });

  it("typeToLabel maps each coarse type to a label", () => {
    expect(typeToLabel("procedure")).toBe("Procedure");
    expect(typeToLabel("medication")).toBe("Medication");
    expect(typeToLabel("treatment")).toBe("Treatment");
    expect(typeToLabel("test")).toBe("Test");
    expect(typeToLabel("supplement")).toBe("Supplement");
    expect(typeToLabel("lifestyle")).toBe("Lifestyle");
    expect(typeToLabel("product")).toBe("Product");
    expect(typeToLabel("not_sure")).toBe("Not sure yet");
  });
});

describe("topicSlug mappers", () => {
  it("topicSlugToLabel maps each entity slug to a label", () => {
    expect(topicSlugToLabel("thermage")).toBe("Thermage");
    expect(topicSlugToLabel("ultherapy")).toBe("Ultherapy");
    expect(topicSlugToLabel("botox")).toBe("Botox");
    expect(topicSlugToLabel("laser")).toBe("Laser");
    expect(topicSlugToLabel("filler")).toBe("Filler");
    expect(topicSlugToLabel("hrt")).toBe("HRT");
    expect(topicSlugToLabel("skincare")).toBe("Skincare");
    expect(topicSlugToLabel("clinic")).toBe("Clinic");
  });
});

describe("deriveHomeState", () => {
  it("total=0 → new（全新用户）", () => {
    expect(
      deriveHomeState({ total: 0, actionableCount: 0, checkInDueCount: 0 }),
    ).toBe("new");
  });

  it("actionableCount>0 → actionable", () => {
    expect(
      deriveHomeState({ total: 3, actionableCount: 2, checkInDueCount: 0 }),
    ).toBe("actionable");
  });

  it("checkInDueCount>0（actionable=0）→ actionable（P1 到期也算有事）", () => {
    expect(
      deriveHomeState({ total: 3, actionableCount: 0, checkInDueCount: 1 }),
    ).toBe("actionable");
  });

  it("total>0 且 actionable=0 且无 check-in → empty（老用户空，非新用户，§10）", () => {
    expect(
      deriveHomeState({ total: 5, actionableCount: 0, checkInDueCount: 0 }),
    ).toBe("empty");
  });
});

describe("spine flow text builders", () => {
  it("skinConsiderToQuestion joins symptom labels", () => {
    expect(skinConsiderToQuestion(["Dryness", "Redness"])).toBe(
      "Skin: Dryness, Redness",
    );
    expect(skinConsiderToQuestion(["Breakouts"])).toBe("Skin: Breakouts");
  });

  it("stackConsiderToQuestion joins supplement + duration", () => {
    expect(stackConsiderToQuestion("Magnesium", "1–2 months")).toBe(
      "Magnesium · 1–2 months",
    );
  });

  it("feelObserveToQuestion returns fixed text", () => {
    expect(feelObserveToQuestion()).toBe("How I've been feeling");
  });

  it("buildEntryText wraps flow source + chips", () => {
    expect(buildEntryText("skin-analysis", "Dryness, Redness")).toBe(
      "Created from Skin analysis · Dryness, Redness",
    );
    expect(
      buildEntryText("supplement-evaluation", "Magnesium · 1–2 months"),
    ).toBe("Created from Supplement evaluation · Magnesium · 1–2 months");
    expect(buildEntryText("feel-check-in", "How I've been feeling")).toBe(
      "Created from Feel check-in · How I've been feeling",
    );
  });
});

describe("task-41 decide mappers", () => {
  it("outcomeToLabel covers all 8 outcomes", () => {
    // Type A
    expect(outcomeToLabel("still_considering")).toBe("Still considering");
    expect(outcomeToLabel("decided_to_do_it")).toBe("Decided to do it");
    expect(outcomeToLabel("decided_not_to")).toBe("Decided not to");
    expect(outcomeToLabel("talk_with_clinician_first")).toBe(
      "Talk with clinician first",
    );
    // Type B
    expect(outcomeToLabel("keep_exploring")).toBe("Keep exploring");
    expect(outcomeToLabel("discuss_with_clinician")).toBe(
      "Discuss with clinician",
    );
    expect(outcomeToLabel("come_back_later")).toBe("Come back later");
    expect(outcomeToLabel("decided_on_next_step")).toBe("Decided on next step");
  });

  it("outcomesForKind returns 4 per kind, empty for unconfirmed", () => {
    expect(outcomesForKind("action")).toHaveLength(4);
    expect(outcomesForKind("action")).toContain("decided_to_do_it");
    expect(outcomesForKind("exploration")).toHaveLength(4);
    expect(outcomesForKind("exploration")).toContain("decided_on_next_step");
    expect(outcomesForKind("unconfirmed")).toHaveLength(0);
  });

  it("KIND_OPTIONS exposes action + exploration (no unconfirmed)", () => {
    expect(KIND_OPTIONS.map((o) => o.kind)).toEqual(["action", "exploration"]);
  });

  it("archivedEntryLabel rebuilds from synthesis with nextStep", () => {
    const { prefix, body } = archivedEntryLabel({
      outcome: "decided_on_next_step",
      nextStep: "Try topical retinol",
    });
    expect(prefix).toBe("Closed");
    expect(body).toBe("Decided on next step — Try topical retinol");
  });

  it("archivedEntryLabel handles null outcome", () => {
    const { prefix, body } = archivedEntryLabel({
      outcome: null,
      nextStep: null,
    });
    expect(prefix).toBe("Closed");
    expect(body).toBe("Undecided");
  });

  it("archivedEntryLabel handles null synthesis entirely", () => {
    const { prefix, body } = archivedEntryLabel(null);
    expect(prefix).toBe("Closed");
    expect(body).toBe("Undecided");
  });

  it("archivedEntryLabel omits nextStep when null", () => {
    const { body } = archivedEntryLabel({
      outcome: "decided_to_do_it",
      nextStep: null,
    });
    expect(body).toBe("Decided to do it");
  });
});
