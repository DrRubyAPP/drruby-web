import { describe, expect, it } from "vitest";
import {
  formatRecordedAt,
  kindLabelKey,
  statusLabelKey,
  toIsoDate,
} from "./dto";

describe("toIsoDate", () => {
  it("空串 → null", () => {
    expect(toIsoDate("")).toBeNull();
  });

  it('"2026-06-08" → ISO 字符串', () => {
    const iso = toIsoDate("2026-06-08");
    expect(iso).not.toBeNull();
    // 同一天（容忍时区渲染差异，仅校验可解析且落在该日附近）
    expect(new Date(iso as string).toISOString()).toBe(iso);
    expect(iso).toContain("2026-06-08");
  });

  it("非法输入 → null", () => {
    expect(toIsoDate("not-a-date")).toBeNull();
  });
});

describe("formatRecordedAt", () => {
  it("ISO → 人类可读日期", () => {
    expect(formatRecordedAt("2026-06-08T00:00:00.000Z")).toBe("Jun 8, 2026");
  });

  it("非法串 → 原样回退", () => {
    expect(formatRecordedAt("garbage")).toBe("garbage");
  });
});

describe("label key 拼接", () => {
  it("kindLabelKey", () => {
    expect(kindLabelKey("lab")).toBe("kind.lab");
    expect(kindLabelKey("vitals")).toBe("kind.vitals");
  });

  it("statusLabelKey", () => {
    expect(statusLabelKey("manual")).toBe("status.manual");
    expect(statusLabelKey("pending")).toBe("status.pending");
  });
});
