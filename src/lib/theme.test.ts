import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, normalizeTheme } from "@/lib/theme";

describe("normalizeTheme", () => {
  it("returns dark only for the exact 'dark' value", () => {
    expect(normalizeTheme("dark")).toBe("dark");
  });

  it("returns light for 'light'", () => {
    expect(normalizeTheme("light")).toBe("light");
  });

  it("falls back to the default for missing/invalid values", () => {
    expect(normalizeTheme(undefined)).toBe(DEFAULT_THEME);
    expect(normalizeTheme(null)).toBe(DEFAULT_THEME);
    expect(normalizeTheme("")).toBe(DEFAULT_THEME);
    expect(normalizeTheme("DARK")).toBe(DEFAULT_THEME);
    expect(normalizeTheme("garbage")).toBe(DEFAULT_THEME);
  });
});
