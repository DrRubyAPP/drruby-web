import { describe, expect, it } from "vitest";
import { exportFileName } from "./export-helpers";

describe("exportFileName", () => {
  it("格式化为 drruby-export-YYYY-MM-DD.json", () => {
    // 月份 0-based：7 → 08
    expect(exportFileName(new Date(2026, 7, 11))).toBe(
      "drruby-export-2026-08-11.json",
    );
  });

  it("个位月/日补零", () => {
    expect(exportFileName(new Date(2026, 0, 5))).toBe(
      "drruby-export-2026-01-05.json",
    );
  });

  it("两位月/日不额外补零", () => {
    expect(exportFileName(new Date(2025, 11, 31))).toBe(
      "drruby-export-2025-12-31.json",
    );
  });
});
