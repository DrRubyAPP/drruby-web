import { describe, expect, it } from "vitest";
import type { DecisionDetailDto, DecisionDto } from "./dto";
import {
  ALL_DECISION_TYPES,
  buildEntryText,
  chipToQuestionTemplate,
  chipToType,
  DECISION_CHIPS,
  DECISION_STATUSES,
  feelObserveToQuestion,
  GOAL_OPTIONS,
  goalToLabel,
  groupDecisions,
  isActive,
  mapBrief,
  mapDecisionDetail,
  skinConsiderToQuestion,
  sortEntries,
  stackConsiderToQuestion,
  statusToLabel,
  typeToLabel,
} from "./mappers";

describe("statusToLabel", () => {
  it("maps 4 statuses to badge labels", () => {
    expect(statusToLabel("considering")).toBe("Considering");
    expect(statusToLabel("in-progress")).toBe("In progress");
    expect(statusToLabel("decided")).toBe("Decided");
    expect(statusToLabel("paused")).toBe("Paused");
  });
});

describe("isActive", () => {
  it("returns true for considering/in-progress/paused, false for decided", () => {
    expect(isActive("considering")).toBe(true);
    expect(isActive("in-progress")).toBe(true);
    expect(isActive("paused")).toBe(true);
    expect(isActive("decided")).toBe(false);
  });
});

describe("groupDecisions", () => {
  const mkDecision = (
    id: string,
    status: DecisionDto["status"],
  ): DecisionDto => ({
    id,
    question: `q-${id}`,
    goal: null,
    type: null,
    status,
    saved: true,
    yourselfContext: null,
    updated: "2026-08-10T00:00:00.000Z",
  });

  it("empty array → both groups empty", () => {
    expect(groupDecisions([])).toEqual({ active: [], saved: [] });
  });

  it("splits mixed list into active and saved preserving order", () => {
    const items = [
      mkDecision("a1", "considering"),
      mkDecision("s1", "decided"),
      mkDecision("a2", "in-progress"),
      mkDecision("s2", "decided"),
      mkDecision("a3", "paused"),
    ];
    expect(groupDecisions(items)).toEqual({
      active: [
        mkDecision("a1", "considering"),
        mkDecision("a2", "in-progress"),
        mkDecision("a3", "paused"),
      ],
      saved: [mkDecision("s1", "decided"), mkDecision("s2", "decided")],
    });
  });

  it("all decided → active empty", () => {
    const items = [mkDecision("s1", "decided"), mkDecision("s2", "decided")];
    expect(groupDecisions(items).active).toEqual([]);
  });

  it("all active → saved empty", () => {
    const items = [mkDecision("a1", "considering"), mkDecision("a2", "paused")];
    expect(groupDecisions(items).saved).toEqual([]);
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
    statusSnapshot: "considering" as const,
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
    type: "thermage",
    status: "considering",
    saved: true,
    yourselfContext: "some context",
    updated: "2026-08-10T00:00:00.000Z",
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
        statusSnapshot: "considering",
        occurredAt: "2026-08-05T00:00:00.000Z",
      },
      {
        id: "e1",
        text: "first",
        statusSnapshot: "considering",
        occurredAt: "2026-08-01T00:00:00.000Z",
      },
    ],
  };

  it("merges question + statusLabel + sorted entries + brief", () => {
    const view = mapDecisionDetail(detail);
    expect(view.id).toBe("d1");
    expect(view.question).toBe("Should I do Thermage?");
    expect(view.goal).toBe("firmness");
    expect(view.status).toBe("considering");
    expect(view.statusLabel).toBe("Considering");
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
  it("DECISION_CHIPS lists 9 chips in stable order", () => {
    expect(DECISION_CHIPS).toEqual([
      "Thermage",
      "Ultherapy",
      "Botox",
      "Laser",
      "Filler",
      "HRT",
      "A skincare product",
      "A doctor or clinic",
      "Not sure yet",
    ]);
    expect(DECISION_CHIPS).toHaveLength(9);
  });

  it("chipToType maps each chip to DecisionType", () => {
    expect(chipToType("Thermage")).toBe("thermage");
    expect(chipToType("HRT")).toBe("hrt");
    expect(chipToType("A skincare product")).toBe("skincare");
    expect(chipToType("Not sure yet")).toBe("not_sure");
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

describe("DECISION_STATUSES", () => {
  it("has 4 values in stable order", () => {
    expect(DECISION_STATUSES).toEqual([
      "considering",
      "in-progress",
      "decided",
      "paused",
    ]);
  });
});

describe("type mappers", () => {
  it("ALL_DECISION_TYPES lists 9 types in stable order", () => {
    expect(ALL_DECISION_TYPES).toEqual([
      "thermage",
      "ultherapy",
      "botox",
      "laser",
      "filler",
      "hrt",
      "skincare",
      "clinic",
      "not_sure",
    ]);
    expect(ALL_DECISION_TYPES).toHaveLength(9);
  });

  it("typeToLabel maps each type to a label", () => {
    expect(typeToLabel("thermage")).toBe("Thermage");
    expect(typeToLabel("ultherapy")).toBe("Ultherapy");
    expect(typeToLabel("botox")).toBe("Botox");
    expect(typeToLabel("laser")).toBe("Laser");
    expect(typeToLabel("filler")).toBe("Filler");
    expect(typeToLabel("hrt")).toBe("HRT");
    expect(typeToLabel("skincare")).toBe("Skincare");
    expect(typeToLabel("clinic")).toBe("Clinic");
    expect(typeToLabel("not_sure")).toBe("Not sure yet");
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
