import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import zh from "./messages/zh.json";

// Collect the full set of leaf key paths (including array indices) so a missing
// or extra translation key — or a mismatched array length — fails the test.
const keys = (o: unknown, p = ""): string[] => {
  if (Array.isArray(o)) return o.flatMap((v, i) => keys(v, `${p}[${i}]`));
  if (o && typeof o === "object") {
    return Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k));
  }
  return [p];
};

describe("i18n messages", () => {
  it("zh has the same key set as en", () => {
    expect(keys(zh).sort()).toEqual(keys(en).sort());
  });
});
