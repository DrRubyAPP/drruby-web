import { describe, expect, it } from "vitest";
import {
  buildEntryText,
  moment1ChipsSummary,
  moment1ToQuestion,
  moment2ChipsSummary,
  moment2ToQuestion,
  moment3ChipsSummary,
  moment3ToQuestion,
} from "./mappers";

describe("moment1 chips summary", () => {
  it("joins labels with comma", () => {
    expect(moment1ChipsSummary(["Dryness", "Redness"])).toBe(
      "Dryness, Redness",
    );
  });
  it("preserves 'All of the above' literally", () => {
    expect(moment1ChipsSummary(["All of the above"])).toBe("All of the above");
  });
  it("empty array → empty string", () => {
    expect(moment1ChipsSummary([])).toBe("");
  });
});

describe("moment2 chips summary", () => {
  it("joins supplement + duration with middot", () => {
    expect(moment2ChipsSummary("Magnesium", "1–2 months")).toBe(
      "Magnesium · 1–2 months",
    );
  });
});

describe("moment3 chips summary", () => {
  it("returns same fixed text as moment3ToQuestion", () => {
    expect(moment3ChipsSummary()).toBe(moment3ToQuestion());
  });
});

describe("re-exports", () => {
  it("moment1ToQuestion + buildEntryText chain works", () => {
    const labels = ["Dryness", "Redness"];
    const q = moment1ToQuestion(labels);
    const e = buildEntryText(1, moment1ChipsSummary(labels));
    expect(q).toBe("Skin: Dryness, Redness");
    expect(e).toBe("Created from Moment 1 · Dryness, Redness");
  });

  it("moment2ToQuestion + buildEntryText chain works", () => {
    const q = moment2ToQuestion("Magnesium", "1–2 months");
    const e = buildEntryText(2, moment2ChipsSummary("Magnesium", "1–2 months"));
    expect(q).toBe("Magnesium · 1–2 months");
    expect(e).toBe("Created from Moment 2 · Magnesium · 1–2 months");
  });

  it("moment3 chain works", () => {
    const q = moment3ToQuestion();
    const e = buildEntryText(3, moment3ChipsSummary());
    expect(q).toBe("How I've been feeling");
    expect(e).toBe("Created from Moment 3 · How I've been feeling");
  });
});
