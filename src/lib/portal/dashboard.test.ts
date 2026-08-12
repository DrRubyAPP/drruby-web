import { describe, expect, it } from "vitest";
import {
  getFirstName,
  getGreetingKey,
  getInitials,
  getTierKey,
  getTimeOfDay,
} from "./dashboard";

describe("getTimeOfDay", () => {
  it("5-11 为 morning", () => {
    for (let h = 5; h <= 11; h++) {
      expect(getTimeOfDay(new Date(2026, 0, 1, h))).toBe("morning");
    }
  });
  it("12-17 为 afternoon", () => {
    for (let h = 12; h <= 17; h++) {
      expect(getTimeOfDay(new Date(2026, 0, 1, h))).toBe("afternoon");
    }
  });
  it("18-4 为 evening", () => {
    for (const h of [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4]) {
      expect(getTimeOfDay(new Date(2026, 0, 1, h))).toBe("evening");
    }
  });
});

describe("getGreetingKey", () => {
  it("返回 portal 命名空间下的 dashboard.greeting.{tod} key", () => {
    expect(getGreetingKey(new Date(2026, 0, 1, 8))).toBe("dashboard.greeting.morning");
    expect(getGreetingKey(new Date(2026, 0, 1, 14))).toBe("dashboard.greeting.afternoon");
    expect(getGreetingKey(new Date(2026, 0, 1, 22))).toBe("dashboard.greeting.evening");
  });
});

describe("getInitials", () => {
  it("双名取前两词首字母大写", () => {
    expect(getInitials("Ruby Johnson")).toBe("RJ");
  });
  it("单名取首字母", () => {
    expect(getInitials("Ruby")).toBe("R");
  });
  it("空字符串返回空", () => {
    expect(getInitials("")).toBe("");
  });
  it("前后空白被 trim", () => {
    expect(getInitials("  Ruby  Johnson  ")).toBe("RJ");
  });
  it("三词只取前两词", () => {
    expect(getInitials("Ada Marie Lovelace")).toBe("AM");
  });
});

describe("getFirstName", () => {
  it("返回第一个词", () => {
    expect(getFirstName("Ruby Johnson")).toBe("Ruby");
  });
  it("单名原样返回", () => {
    expect(getFirstName("Ruby")).toBe("Ruby");
  });
  it("空字符串原样返回", () => {
    expect(getFirstName("")).toBe("");
  });
});

describe("getTierKey", () => {
  it("已知 tier 返回对应 key", () => {
    expect(getTierKey("free")).toBe("dashboard.profile.plan.free");
    expect(getTierKey("plus")).toBe("dashboard.profile.plan.plus");
    expect(getTierKey("pro")).toBe("dashboard.profile.plan.pro");
  });
  it("未知 tier 回退到 unknown", () => {
    expect(getTierKey("enterprise")).toBe("dashboard.profile.plan.unknown");
    expect(getTierKey("")).toBe("dashboard.profile.plan.unknown");
  });
});
