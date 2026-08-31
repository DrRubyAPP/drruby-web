import { describe, expect, it } from "vitest";
import { isRelevant } from "./relevance";
import type { ConnectedRecordRef, HealthContext } from "./types";

function makeRecord(
  overrides: Partial<ConnectedRecordRef>,
): ConnectedRecordRef {
  return {
    id: "rec1",
    kind: "lab",
    documentClass: "Lab",
    summary: "Estradiol 50, FSH 80",
    ...overrides,
  };
}

function makeDecision(
  overrides: {
    topicSlug?: string | null;
    healthContext?: HealthContext | null;
    topic?: string | null;
  } = {},
) {
  return {
    id: "dec1",
    question: "Try HRT?",
    // 用 !== undefined 而非 ?? 以尊重 null（?? 会把 null 当 nullish 替换为 "hrt"）
    topicSlug: overrides.topicSlug !== undefined ? overrides.topicSlug : "hrt",
    topic: overrides.topic !== undefined ? overrides.topic : "HRT",
    healthContext:
      overrides.healthContext !== undefined
        ? overrides.healthContext
        : {
            symptoms: "hot flashes",
            medications_treatments: "none",
            related_health_changes: "perimenopause",
            current_health_state: "fatigue",
            goals_concerns: "sleep",
          },
    yourselfContext: null,
  };
}

describe("RelevanceEngine (D2 规则)", () => {
  it("HRT Decision + hormone lab record → 相关（topicSlug→Lab 映射命中）", () => {
    const record = makeRecord({
      id: "rec1",
      kind: "lab",
      documentClass: "Lab",
      summary: "Estradiol 50, FSH 80",
    });
    const decision = makeDecision();
    expect(isRelevant(record, decision)).toBe(true);
  });

  it("HRT Decision + 不相关皮肤照片 → 不相关（Imaging 不在 hrt 映射集）", () => {
    const record = makeRecord({
      id: "rec2",
      kind: "imaging",
      documentClass: "Imaging",
      summary: "Skin photo of cheek",
    });
    const decision = makeDecision({ topicSlug: "hrt" });
    expect(isRelevant(record, decision)).toBe(false);
  });

  it("Skincare Decision + imaging/photo → 相关", () => {
    const record = makeRecord({
      id: "rec3",
      kind: "imaging",
      documentClass: "Imaging",
      summary: "Skin photo of cheek",
    });
    const decision = makeDecision({
      topicSlug: "skincare",
      healthContext: { symptoms: "acne" },
    });
    expect(isRelevant(record, decision)).toBe(true);
  });

  it("空 topicSlug → 保守 false（除非 healthContext 关键词命中 record.summary）", () => {
    const record = makeRecord({
      id: "rec4",
      kind: "lab",
      documentClass: "Lab",
      summary: "Thyroid panel normal",
    });
    const decision = makeDecision({
      topicSlug: null,
      healthContext: { symptoms: "thyroid issues" },
    });
    // healthContext.symptoms 含 "thyroid"，record.summary 含 "Thyroid" → 关键词命中
    expect(isRelevant(record, decision)).toBe(true);
  });

  it("空 topicSlug 且无关键词命中 → 保守 false", () => {
    const record = makeRecord({
      id: "rec5",
      kind: "lab",
      documentClass: "Lab",
      summary: "Cholesterol 180",
    });
    const decision = makeDecision({
      topicSlug: null,
      healthContext: { symptoms: "hot flashes" },
    });
    expect(isRelevant(record, decision)).toBe(false);
  });

  it("record.kind 也参与匹配（即使 documentClass 缺失）", () => {
    const record: ConnectedRecordRef = {
      id: "rec6",
      kind: "lab",
      documentClass: null,
      summary: "Estradiol 50",
    };
    const decision = makeDecision({ topicSlug: "hrt" });
    expect(isRelevant(record, decision)).toBe(true);
  });

  it("healthContext 5 类全部空 → 仅靠 topicSlug 映射", () => {
    const record = makeRecord({
      id: "rec7",
      kind: "lab",
      documentClass: "Lab",
      summary: "Estradiol 50",
    });
    const decision = makeDecision({
      topicSlug: "hrt",
      healthContext: null,
    });
    expect(isRelevant(record, decision)).toBe(true);
  });
});
