import { describe, expect, it } from "vitest";
import { decisionStatusLabel } from "./decisionStatus";

describe("decisionStatusLabel", () => {
  it("uses plain-language labels for each decision state", () => {
    expect(decisionStatusLabel("ACTIVE")).toBe("considering");
    expect(decisionStatusLabel("DECIDED")).toBe("ongoing");
    expect(decisionStatusLabel("OBSERVING")).toBe("ongoing");
    expect(decisionStatusLabel("LEARNING")).toBe("ongoing");
    expect(decisionStatusLabel("CLOSED")).toBe("give up");
    expect(decisionStatusLabel("COMPLETED")).toBe("finished");
  });
});
