import { describe, expect, it } from "vitest";
import type {
  AiState,
  AiStateDto,
  ChangeTrigger,
  DecisionDetailDto,
  DecisionDto,
  DecisionSnapshotDto,
  HealthContextCategory,
  HealthContextDto,
  SynthesisProvenance,
} from "./dto";
import {
  ALL_DECISION_TYPES,
  aiStateToView,
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
  HEALTH_CONTEXT_CATEGORIES,
  HEALTH_CONTEXT_CATEGORY_LABEL_KEYS,
  isActionable,
  isDegradedProvenance,
  KIND_OPTIONS,
  lifecycleToLabel,
  mapAiStateDto,
  mapBrief,
  mapDecisionDetail,
  mapHealthContextToCategories,
  mapSnapshotToView,
  outcomesForKind,
  outcomeToLabel,
  PERSPECTIVES,
  skinConsiderToQuestion,
  sortEntries,
  sortSnapshotsDesc,
  stackConsiderToQuestion,
  topicSlugToLabel,
  triggerToHumanLabelKey,
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

// =============================================================================
// task-43 综合结果层 mappers
// =============================================================================

describe("task-43 triggerToHumanLabelKey", () => {
  it("maps each ChangeTrigger to a decisions.snapshot.trigger.<value> i18n key", () => {
    expect(triggerToHumanLabelKey("new_record")).toBe(
      "decisions.snapshot.trigger.new_record",
    );
    expect(triggerToHumanLabelKey("health_context_update")).toBe(
      "decisions.snapshot.trigger.health_context_update",
    );
    expect(triggerToHumanLabelKey("others_refresh")).toBe(
      "decisions.snapshot.trigger.others_refresh",
    );
    expect(triggerToHumanLabelKey("science_refresh")).toBe(
      "decisions.snapshot.trigger.science_refresh",
    );
    expect(triggerToHumanLabelKey("observation_update")).toBe(
      "decisions.snapshot.trigger.observation_update",
    );
  });

  it("maps initial sentinel to its own key (R1 首版 Snapshot)", () => {
    expect(triggerToHumanLabelKey("initial")).toBe(
      "decisions.snapshot.trigger.initial",
    );
  });

  it("covers all 6 ChangeTrigger values (no missing key)", () => {
    const all: ChangeTrigger[] = [
      "new_record",
      "health_context_update",
      "others_refresh",
      "science_refresh",
      "observation_update",
      "initial",
    ];
    for (const t of all) {
      expect(triggerToHumanLabelKey(t)).toBe(`decisions.snapshot.trigger.${t}`);
    }
  });
});

describe("task-43 aiStateToView", () => {
  it("LOADING → messageKey loading, no retryable, no pendingUntil", () => {
    const v = aiStateToView("LOADING", "yourself");
    expect(v.state).toBe("LOADING");
    expect(v.messageKey).toBe("loading");
    expect(v.retryable).toBeUndefined();
    expect(v.pendingUntil).toBeUndefined();
  });

  it("READY → messageKey ready", () => {
    const v = aiStateToView("READY", "others");
    expect(v.state).toBe("READY");
    expect(v.messageKey).toBe("ready");
    expect(v.retryable).toBeUndefined();
  });

  it("INSUFFICIENT_INFORMATION → per-perspective key (三视角文案)", () => {
    expect(
      aiStateToView("INSUFFICIENT_INFORMATION", "yourself").messageKey,
    ).toBe("insufficient.yourself");
    expect(aiStateToView("INSUFFICIENT_INFORMATION", "others").messageKey).toBe(
      "insufficient.others",
    );
    expect(
      aiStateToView("INSUFFICIENT_INFORMATION", "science").messageKey,
    ).toBe("insufficient.science");
  });

  it("FAILED → messageKey failed + retryable=true (§26 Retry)", () => {
    const v = aiStateToView("FAILED", "yourself");
    expect(v.state).toBe("FAILED");
    expect(v.messageKey).toBe("failed");
    expect(v.retryable).toBe(true);
  });

  it("STALE_UPDATE_AVAILABLE → messageKey stale + pendingUntil passed through", () => {
    const v = aiStateToView("STALE_UPDATE_AVAILABLE", "yourself", {
      pendingUntil: "2026-08-31T12:00:00.000Z",
    });
    expect(v.state).toBe("STALE_UPDATE_AVAILABLE");
    expect(v.messageKey).toBe("stale");
    expect(v.pendingUntil).toBe("2026-08-31T12:00:00.000Z");
  });

  it("STALE_UPDATE_AVAILABLE without pendingUntil → pendingUntil undefined", () => {
    const v = aiStateToView("STALE_UPDATE_AVAILABLE", "others");
    expect(v.pendingUntil).toBeUndefined();
  });

  it("PERSPECTIVES lists 3 perspectives in stable order", () => {
    expect(PERSPECTIVES).toEqual(["yourself", "others", "science"]);
  });
});

describe("task-43 isDegradedProvenance", () => {
  it("returns true only for template+llm_trigger_degraded (R6 透明化)", () => {
    expect(isDegradedProvenance("template+llm_trigger_degraded")).toBe(true);
    expect(isDegradedProvenance("template")).toBe(false);
    expect(isDegradedProvenance("template+llm_trigger")).toBe(false);
    expect(isDegradedProvenance("initial")).toBe(false);
  });
});

describe("task-43 HEALTH_CONTEXT helpers", () => {
  it("HEALTH_CONTEXT_CATEGORIES lists 5 categories in stable order (§19)", () => {
    expect(HEALTH_CONTEXT_CATEGORIES).toEqual([
      "symptoms",
      "medications_treatments",
      "related_health_changes",
      "current_health_state",
      "goals_concerns",
    ]);
  });

  it("HEALTH_CONTEXT_CATEGORY_LABEL_KEYS maps 5 categories to categories.<key> (relative to decisions.healthContext namespace)", () => {
    expect(HEALTH_CONTEXT_CATEGORY_LABEL_KEYS.symptoms).toBe(
      "categories.symptoms",
    );
    expect(HEALTH_CONTEXT_CATEGORY_LABEL_KEYS.goals_concerns).toBe(
      "categories.goals_concerns",
    );
  });
});

describe("task-43 mapHealthContextToCategories", () => {
  it("returns 5 entries in stable order even when input has missing categories", () => {
    const dto: HealthContextDto = {
      healthContext: {
        symptoms: "Hot flashes",
        goals_concerns: "Better sleep",
      },
      status: "unconfirmed",
    };
    const rows = mapHealthContextToCategories(dto);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({
      category: "symptoms",
      labelKey: "categories.symptoms",
      value: "Hot flashes",
    });
    expect(rows[1]).toEqual({
      category: "medications_treatments",
      labelKey: "categories.medications_treatments",
      value: "",
    });
    expect(rows[4].value).toBe("Better sleep");
  });

  it("returns 5 empty entries when healthContext is null (首次进入)", () => {
    const rows = mapHealthContextToCategories({
      healthContext: null,
      status: null,
    });
    expect(rows).toHaveLength(5);
    for (const r of rows) expect(r.value).toBe("");
  });

  it("coerces non-string values to string (defensive)", () => {
    const rows = mapHealthContextToCategories({
      healthContext: {
        symptoms: { weird: "object" } as unknown as string,
      } as Record<HealthContextCategory, string>,
      status: "unconfirmed",
    });
    expect(rows[0].value).toBe("[object Object]");
  });
});

describe("task-43 AiStateDto mirror", () => {
  it("server AiStateDTO shape: yourself/others/science + pendingUntil", () => {
    const dto: AiStateDto = {
      yourself: "READY",
      others: "INSUFFICIENT_INFORMATION",
      science: "READY",
      pendingUntil: null,
    };
    expect(dto.yourself).toBe("READY");
    expect(dto.others).toBe("INSUFFICIENT_INFORMATION");
    // pendingUntil nullable 透传
    const stale: AiStateDto = {
      yourself: "STALE_UPDATE_AVAILABLE",
      others: "STALE_UPDATE_AVAILABLE",
      science: "STALE_UPDATE_AVAILABLE",
      pendingUntil: "2026-08-31T12:00:00.000Z",
    };
    expect(stale.pendingUntil).toBe("2026-08-31T12:00:00.000Z");
  });

  it("AiState enum literal types compile-time check (5 states)", () => {
    const states: AiState[] = [
      "LOADING",
      "READY",
      "INSUFFICIENT_INFORMATION",
      "FAILED",
      "STALE_UPDATE_AVAILABLE",
    ];
    expect(states).toHaveLength(5);
  });
});

describe("task-43 mapAiStateDto", () => {
  it("把 server DTO 三视角 + pendingUntil 转成 AiStateView 三元组", () => {
    const views = mapAiStateDto({
      yourself: "INSUFFICIENT_INFORMATION",
      others: "READY",
      science: "STALE_UPDATE_AVAILABLE",
      pendingUntil: "2026-08-31T12:00:00.000Z",
    });
    expect(views.yourself).toEqual({
      state: "INSUFFICIENT_INFORMATION",
      messageKey: "insufficient.yourself",
    });
    expect(views.others).toEqual({
      state: "READY",
      messageKey: "ready",
    });
    expect(views.science).toEqual({
      state: "STALE_UPDATE_AVAILABLE",
      messageKey: "stale",
      pendingUntil: "2026-08-31T12:00:00.000Z",
    });
  });

  it("pendingUntil null/undefined → 各视角 view 不带 pendingUntil（非 STALE）", () => {
    const views = mapAiStateDto({
      yourself: "READY",
      others: "READY",
      science: "READY",
      pendingUntil: null,
    });
    expect(views.yourself.pendingUntil).toBeUndefined();
  });
});

describe("task-43 mapSnapshotToView", () => {
  const snap: DecisionSnapshotDto = {
    id: "snap1",
    decisionId: "d1",
    yourselfContextRef: null,
    sources: null,
    citations: null,
    synthesis: {
      yourself: "y",
      others: "o",
      science: "s",
      combined: "y\n\no\n\ns",
    },
    provenance: "template+llm_trigger_degraded",
    changeTrigger: "new_record",
    createdAt: "2026-08-31T10:00:00.000Z",
    triggerHumanLabel: "Added a new lab record",
  };

  it("映射核心字段 + triggerLabelKey + degraded=true", () => {
    const v = mapSnapshotToView(snap);
    expect(v.id).toBe("snap1");
    expect(v.changeTrigger).toBe("new_record");
    expect(v.triggerLabelKey).toBe("decisions.snapshot.trigger.new_record");
    expect(v.triggerHumanLabel).toBe("Added a new lab record");
    expect(v.degraded).toBe(true);
    expect(v.synthesis?.combined).toBe("y\n\no\n\ns");
  });

  it("非 degraded provenance → degraded=false", () => {
    const v = mapSnapshotToView({ ...snap, provenance: "template" });
    expect(v.degraded).toBe(false);
  });

  it("triggerHumanLabel undefined 透传（前端回退 i18n triggerLabelKey）", () => {
    const { triggerHumanLabel, triggerLabelKey } = mapSnapshotToView({
      ...snap,
      triggerHumanLabel: undefined,
    });
    expect(triggerHumanLabel).toBeUndefined();
    expect(triggerLabelKey).toBe("decisions.snapshot.trigger.new_record");
  });
});

describe("task-43 sortSnapshotsDesc", () => {
  const mk = (id: string, ts: string): DecisionSnapshotDto => ({
    id,
    decisionId: "d1",
    yourselfContextRef: null,
    sources: null,
    citations: null,
    synthesis: null,
    provenance: "template",
    changeTrigger: "new_record",
    createdAt: ts,
  });

  it("sorts descending by createdAt (new → old)", () => {
    const snaps = [
      mk("s1", "2026-08-01T00:00:00.000Z"),
      mk("s3", "2026-08-31T00:00:00.000Z"),
      mk("s2", "2026-08-15T00:00:00.000Z"),
    ];
    expect(sortSnapshotsDesc(snaps).map((s) => s.id)).toEqual([
      "s3",
      "s2",
      "s1",
    ]);
  });

  it("preserves original array (immutable)", () => {
    const snaps = [
      mk("s2", "2026-08-15T00:00:00.000Z"),
      mk("s1", "2026-08-01T00:00:00.000Z"),
    ];
    const sorted = sortSnapshotsDesc(snaps);
    expect(snaps.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(sorted.map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("empty array → empty array", () => {
    expect(sortSnapshotsDesc([])).toEqual([]);
  });
});

describe("task-43 DecisionSnapshotDto mirror", () => {
  it("server DecisionSnapshotDTO shape: 5 核心字段 + triggerHumanLabel optional", () => {
    const snap: DecisionSnapshotDto = {
      id: "snap1",
      decisionId: "d1",
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: {
        yourself: "y",
        others: "o",
        science: "s",
        combined: "y\n\no\n\ns",
      },
      provenance: "template",
      changeTrigger: "new_record",
      createdAt: "2026-08-31T10:00:00.000Z",
    };
    expect(snap.id).toBe("snap1");
    expect(snap.changeTrigger).toBe("new_record");
    expect(snap.synthesis?.combined).toBe("y\n\no\n\ns");
    // triggerHumanLabel optional
    const withoutLabel: DecisionSnapshotDto = { ...snap, id: "snap2" };
    expect(withoutLabel.triggerHumanLabel).toBeUndefined();
  });

  it("SynthesisProvenance 4 values (template | template+llm_trigger | degraded | initial)", () => {
    const ps: SynthesisProvenance[] = [
      "template",
      "template+llm_trigger",
      "template+llm_trigger_degraded",
      "initial",
    ];
    expect(ps).toHaveLength(4);
  });
});
