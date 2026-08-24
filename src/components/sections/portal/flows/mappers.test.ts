import { describe, expect, it } from "vitest";
import {
  buildEntryText,
  feelChipsSummary,
  feelObserveToQuestion,
  skinChipsSummary,
  skinConsiderToQuestion,
  stackChipsSummary,
  stackConsiderToQuestion,
} from "./mappers";

describe("skin flow chips summary", () => {
  it("joins labels with comma", () => {
    expect(skinChipsSummary(["Dryness", "Redness"])).toBe("Dryness, Redness");
  });
  it("preserves 'All of the above' literally", () => {
    expect(skinChipsSummary(["All of the above"])).toBe("All of the above");
  });
  it("empty array → empty string", () => {
    expect(skinChipsSummary([])).toBe("");
  });
});

describe("stack flow chips summary", () => {
  it("joins supplement + duration with middot", () => {
    expect(stackChipsSummary("Magnesium", "1–2 months")).toBe(
      "Magnesium · 1–2 months",
    );
  });
});

describe("feel flow chips summary", () => {
  it("returns same fixed text as feelObserveToQuestion", () => {
    expect(feelChipsSummary()).toBe(feelObserveToQuestion());
  });
});

describe("re-exports", () => {
  it("skinConsiderToQuestion + buildEntryText chain works", () => {
    const labels = ["Dryness", "Redness"];
    const q = skinConsiderToQuestion(labels);
    const e = buildEntryText("skin-analysis", skinChipsSummary(labels));
    expect(q).toBe("Skin: Dryness, Redness");
    expect(e).toBe("Created from Skin analysis · Dryness, Redness");
  });

  it("stackConsiderToQuestion + buildEntryText chain works", () => {
    const q = stackConsiderToQuestion("Magnesium", "1–2 months");
    const e = buildEntryText(
      "supplement-evaluation",
      stackChipsSummary("Magnesium", "1–2 months"),
    );
    expect(q).toBe("Magnesium · 1–2 months");
    expect(e).toBe(
      "Created from Supplement evaluation · Magnesium · 1–2 months",
    );
  });

  it("feel flow chain works", () => {
    const q = feelObserveToQuestion();
    const e = buildEntryText("feel-check-in", feelChipsSummary());
    expect(q).toBe("How I've been feeling");
    expect(e).toBe("Created from Feel check-in · How I've been feeling");
  });
});
