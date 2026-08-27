import { describe, expect, it } from "vitest";
import type { DecisionType } from "@/components/sections/portal/decisions/dto";
import { getDecisionCorpus } from "./decision-corpus";

const TYPES: DecisionType[] = [
  "thermage",
  "ultherapy",
  "botox",
  "laser",
  "filler",
  "hrt",
  "skincare",
  "clinic",
  "not_sure",
];

describe("getDecisionCorpus", () => {
  it.each(TYPES)("%s → others 四维非空 + science 三块非空且带来源", (t) => {
    const c = getDecisionCorpus(t);
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

  it("null / undefined → 通用占位（B9）", () => {
    expect(getDecisionCorpus(null)).toBe(getDecisionCorpus(undefined));
    expect(getDecisionCorpus(null).others.helpful.length).toBeGreaterThan(0);
  });

  it("not_sure → 通用占位（与 null 同源，B5）", () => {
    expect(getDecisionCorpus("not_sure")).toBe(getDecisionCorpus(null));
  });
});
