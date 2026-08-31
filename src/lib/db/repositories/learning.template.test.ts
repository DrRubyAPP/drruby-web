import { describe, expect, it } from "vitest";
import { buildLearningTemplate } from "./learning.template";

describe("buildLearningTemplate — task-44 §29 Learning 模板拼装", () => {
  it("空 observations 返回 no-obs 文案 + 空 ids", () => {
    const en = buildLearningTemplate({ observations: [], locale: "en" });
    expect(en.text).toContain("No observations");
    expect(en.supportingObservationIds).toEqual([]);

    const zh = buildLearningTemplate({ observations: [], locale: "zh" });
    expect(zh.text).toContain("尚未记录观察结果");
    expect(zh.supportingObservationIds).toEqual([]);
  });

  it("单条 observation（无重复方向）→ 只报总数", () => {
    const out = buildLearningTemplate({
      observations: [{ id: "1", direction: "better" }],
      locale: "en",
    });
    expect(out.text).toContain("1 observation");
    expect(out.text).not.toContain("more than once");
    expect(out.supportingObservationIds).toEqual(["1"]);
  });

  it("重复方向 ≥2 次 → 'more than once' + 方向值", () => {
    const out = buildLearningTemplate({
      observations: [
        { id: "1", direction: "better" },
        { id: "2", direction: "better" },
        { id: "3", direction: "worse" },
      ],
      locale: "en",
    });
    expect(out.text).toContain("more than once");
    expect(out.text).toContain("better");
    expect(out.text).toContain("2 times");
    expect(out.supportingObservationIds).toEqual(["1", "2", "3"]);
  });

  it("重复方向中文文案", () => {
    const out = buildLearningTemplate({
      observations: [
        { id: "1", direction: "worse" },
        { id: "2", direction: "worse" },
        { id: "3", direction: "worse" },
      ],
      locale: "zh",
    });
    expect(out.text).toContain("不止一次记录到");
    expect(out.text).toContain("worse");
    expect(out.text).toContain("3 次");
    expect(out.text).toContain("这可能值得继续观察");
  });

  it("direction=null 归入 not_sure 桶", () => {
    const out = buildLearningTemplate({
      observations: [
        { id: "1", direction: null },
        { id: "2", direction: null },
        { id: "3", direction: "better" },
      ],
      locale: "en",
    });
    // not_sure 出现 2 次 ≥2 → 触发 "more than once"
    expect(out.text).toContain("more than once");
    expect(out.text).toContain("not_sure");
  });

  it("不出现 §29 禁用的强度/置信度标签", () => {
    const out = buildLearningTemplate({
      observations: [
        { id: "1", direction: "better" },
        { id: "2", direction: "better" },
      ],
      locale: "en",
    });
    expect(out.text).not.toMatch(
      /Emerging|Moderate|Strong|\d+\s*%\s*confidence/i,
    );
  });

  it("supportingObservationIds 默认全部引用（D12 用户可在 UI 取消）", () => {
    const out = buildLearningTemplate({
      observations: [
        { id: "a", direction: "same" },
        { id: "b", direction: "better" },
        { id: "c", direction: "worse" },
        { id: "d", direction: "not_sure" },
      ],
      locale: "en",
    });
    expect(out.supportingObservationIds).toEqual(["a", "b", "c", "d"]);
  });
});
