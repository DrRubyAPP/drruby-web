import { describe, expect, it } from "vitest";
import { getDecisionCorpus } from "@/config/decision-corpus";
import { TemplateSynthesizer } from "./templateSynthesizer";
import type { SynthesisInput } from "./types";

function makeInput(overrides: Partial<SynthesisInput> = {}): SynthesisInput {
  const corpus = getDecisionCorpus("hrt");
  return {
    decision: {
      id: "dec1",
      question: "Try HRT?",
      topicSlug: "hrt",
      topic: "HRT",
      healthContext: {
        symptoms: "hot flashes, sleep disruption",
        medications_treatments: "none currently",
        related_health_changes: "perimenopause onset",
        current_health_state: "fatigue, low mood",
        goals_concerns: "improve sleep quality",
      },
      yourselfContext: null,
    },
    connectedRecords: [
      {
        id: "rec1",
        kind: "lab",
        documentClass: "Lab",
        summary: "Estradiol 50 pg/mL, FSH 80",
      },
    ],
    corpus: {
      others: [corpus.others.helpful[0], corpus.others.difficult[0]].join(" "),
      science: corpus.science.benefits[0]?.text ?? "",
      othersVersion: "v1",
      scienceVersion: "v1",
    },
    changeTrigger: "new_record",
    ...overrides,
  };
}

describe("TemplateSynthesizer", () => {
  it("synthesize Yourself：含 healthContext 5 类 + connected Records summary", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    expect(result.synthesis.yourself).toContain("hot flashes");
    expect(result.synthesis.yourself).toContain("sleep disruption");
    expect(result.synthesis.yourself).toContain("perimenopause onset");
    expect(result.synthesis.yourself).toContain("Estradiol 50 pg/mL");
    expect(result.synthesis.yourself).toContain("improve sleep quality");
  });

  it("synthesize Others/Science：含 corpus 片段", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    expect(result.synthesis.others).toContain("Some people");
    expect(result.synthesis.science).toContain("Hormone therapy");
  });

  it("synthesize combined：拼接 yourself/others/science", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    expect(result.synthesis.combined).toContain(result.synthesis.yourself);
    expect(result.synthesis.combined).toContain(result.synthesis.others);
    expect(result.synthesis.combined).toContain(result.synthesis.science);
  });

  it("provenance=template（默认；trigger 文案 LLM 失败降级 → degraded）", async () => {
    // LLM_TRIGGER_API_KEY 缺失 → trigger 降级
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    // trigger 文案降级 → provenance=template+llm_trigger_degraded
    expect(result.provenance).toBe("template+llm_trigger_degraded");
    // triggerHumanLabel 含人话（不露原始 trigger 值）
    expect(result.triggerHumanLabel).toBeTruthy();
    expect(result.triggerHumanLabel).not.toMatch(/^new_record$/);
  });

  it("B2 fallback：healthContext 空时用 yourselfContext 兜底", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(
      makeInput({
        decision: {
          id: "dec1",
          question: "Try HRT?",
          topicSlug: "hrt",
          healthContext: null,
          yourselfContext: "Perimenopausal, considering HRT for sleep.",
        },
        connectedRecords: [],
      }),
    );

    expect(result.synthesis.yourself).toContain(
      "Perimenopausal, considering HRT for sleep.",
    );
  });

  it("无 healthContext 且无 yourselfContext 且无 connected Records → Yourself INSUFFICIENT 提示", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(
      makeInput({
        decision: {
          id: "dec1",
          question: "Try HRT?",
          topicSlug: "hrt",
          healthContext: null,
          yourselfContext: null,
        },
        connectedRecords: [],
      }),
    );

    // Yourself 部分表达 INSUFFICIENT（前端按状态机条件独立判定，这里仅给空态文本）
    expect(result.synthesis.yourself).toMatch(/don't have enough|not enough/i);
  });

  it("initial trigger → provenance=initial + 不调 LLM", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(
      makeInput({ changeTrigger: "initial" }),
    );

    expect(result.provenance).toBe("initial");
    // initial 不算降级，模板文案即可
    expect(result.triggerHumanLabel).toMatch(/initial|first/i);
  });

  it("sources 含 connected Records + corpus 引用", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    const recordSources = result.sources.filter((s) => s.type === "record");
    expect(recordSources).toHaveLength(1);
    expect(recordSources[0].ref).toBe("rec1");

    const othersSources = result.sources.filter((s) => s.type === "others");
    expect(othersSources.length).toBeGreaterThan(0);

    const scienceSources = result.sources.filter((s) => s.type === "science");
    expect(scienceSources.length).toBeGreaterThan(0);
  });

  it("citations 含 [1]/[2] 标签", async () => {
    const synth = new TemplateSynthesizer();
    const result = await synth.synthesize(makeInput());

    expect(result.citations.length).toBeGreaterThan(0);
    const labels = result.citations.map((c) => c.label);
    expect(labels.some((l) => /^\[\d+\]$/.test(l))).toBe(true);
  });
});
