import { describe, expect, it } from "vitest";
import type { TopicSlug } from "@/components/sections/portal/decisions/dto";
import { getDecisionCorpus } from "./decision-corpus";

const SLUGS: TopicSlug[] = [
  "thermage",
  "ultherapy",
  "botox",
  "laser",
  "filler",
  "hrt",
  "skincare",
  "clinic",
];

describe("getDecisionCorpus", () => {
  it.each(SLUGS)("%s → others 四维非空 + science 三块非空且带来源", (slug) => {
    const c = getDecisionCorpus(slug);
    expect(c.others.helpful.length).toBeGreaterThan(0);
    expect(c.others.difficult.length).toBeGreaterThan(0);
    expect(c.others.varied.length).toBeGreaterThan(0);
    expect(c.others["may-matter"].length).toBeGreaterThan(0);
    for (const key of ["benefits", "risks", "uncertainty"] as const) {
      expect(c.science[key].length).toBeGreaterThan(0);
      for (const item of c.science[key]) {
        expect(item.source.length).toBeGreaterThan(0);
      }
    }
  });

  it("null / undefined → 通用 fallback，science 为空以触发 INSUFFICIENT", () => {
    expect(getDecisionCorpus(null)).toBe(getDecisionCorpus(undefined));
    expect(getDecisionCorpus(null).others.helpful.length).toBeGreaterThan(0);
    expect(getDecisionCorpus(null).science.benefits).toHaveLength(0);
    expect(getDecisionCorpus(null).science.risks).toHaveLength(0);
    expect(getDecisionCorpus(null).science.uncertainty).toHaveLength(0);
  });

  it("未命中 slug → 通用 fallback GENERIC", () => {
    // @ts-expect-error 测试未知 slug（非已知语料 key）
    expect(getDecisionCorpus("unknown-slug")).toBe(getDecisionCorpus(null));
  });

  it("不保留 content-team placeholder 文案", () => {
    const generic = getDecisionCorpus(null);
    const allScienceText = Object.values(generic.science)
      .flat()
      .map((item) => `${item.text} ${item.source}`)
      .join(" ");
    expect(allScienceText).not.toMatch(/placeholder pending content team/i);
    expect(allScienceText).not.toMatch(/pending content team/i);
  });
});
