import { describe, expect, it } from "vitest";
import { insightAccentSchema, insightToneSchema } from "@/lib/db/enums";
import type { Decision, Signal } from "~prisma/client";
import {
  computeAgingVelocity,
  computeAttention,
  type InsightInput,
} from "./rules";

function signal(overrides: Partial<Signal>): Signal {
  return {
    id: "s1",
    userId: "u1",
    label: "雌激素",
    value: "42",
    unit: "pg/mL",
    source: "lab",
    confidence: "observed",
    trend: "flat",
    measuredAt: new Date("2026-08-01"),
    createdAt: new Date("2026-08-01"),
    ...overrides,
  } as Signal;
}

function decision(overrides: Partial<Decision>): Decision {
  return {
    id: "d1",
    userId: "u1",
    question: "是否开始 HRT?",
    lifecycle: "ACTIVE",
    decisionKind: "unconfirmed",
    outcome: null,
    nextStep: null,
    type: null,
    brief: null,
    decidedAt: null,
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    ...overrides,
  } as Decision;
}

function input(overrides: Partial<InsightInput>): InsightInput {
  return { signals: [], timeline: [], decisions: [], ...overrides };
}

describe("computeAttention", () => {
  it("observed 下行信号 → accent=amber", () => {
    const out = computeAttention(
      input({ signals: [signal({ trend: "down", confidence: "observed" })] }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("attention");
    expect(out[0].accent).toBe("amber");
    expect(out[0].tag).toBe("雌激素");
  });

  it("非 observed 下行信号 → accent=purple", () => {
    const out = computeAttention(
      input({ signals: [signal({ trend: "down", confidence: "possible" })] }),
    );
    expect(out[0].accent).toBe("purple");
  });

  it("up / flat 信号不产出 attention", () => {
    const out = computeAttention(
      input({
        signals: [signal({ trend: "up" }), signal({ trend: "flat" })],
      }),
    );
    expect(out).toHaveLength(0);
  });

  it("ACTIVE 决策 → purple 提示，含 question（DECIDED 不产出）", () => {
    const out = computeAttention(
      input({
        decisions: [
          decision({ lifecycle: "ACTIVE", question: "做不做超声炮?" }),
          decision({ lifecycle: "ACTIVE" }),
          decision({ lifecycle: "DECIDED" }),
        ],
      }),
    );
    expect(out).toHaveLength(2);
    expect(out[0].accent).toBe("purple");
    expect(out[0].title).toContain("做不做超声炮?");
  });

  it("最多 6 条 attention", () => {
    const signals = Array.from({ length: 10 }, (_, i) =>
      signal({ id: `s${i}`, trend: "down", label: `信号${i}` }),
    );
    expect(computeAttention(input({ signals }))).toHaveLength(6);
  });

  it("所有 accent 通过 insightAccentSchema", () => {
    const out = computeAttention(
      input({
        signals: [
          signal({ trend: "down", confidence: "observed" }),
          signal({ trend: "down", confidence: "not-assessable" }),
        ],
        decisions: [decision({ lifecycle: "ACTIVE" })],
      }),
    );
    for (const a of out) {
      expect(() => insightAccentSchema.parse(a.accent)).not.toThrow();
    }
  });
});

describe("computeAgingVelocity", () => {
  it("无信号 → tone=purple, value=数据不足", () => {
    const [m] = computeAgingVelocity(input({}));
    expect(m.kind).toBe("aging_velocity");
    expect(m.tone).toBe("purple");
    expect(m.value).toBe("数据不足");
  });

  it("有信号且无下行 → tone=green", () => {
    const [m] = computeAgingVelocity(
      input({ signals: [signal({ trend: "flat" })] }),
    );
    expect(m.tone).toBe("green");
    expect(m.value).toBe("1 项信号");
  });

  it("存在下行信号 → tone=amber", () => {
    const [m] = computeAgingVelocity(
      input({ signals: [signal({ trend: "down" }), signal({ trend: "up" })] }),
    );
    expect(m.tone).toBe("amber");
  });

  it("tone 通过 insightToneSchema", () => {
    for (const data of [
      input({}),
      input({ signals: [signal({ trend: "flat" })] }),
      input({ signals: [signal({ trend: "down" })] }),
    ]) {
      const [m] = computeAgingVelocity(data);
      expect(() => insightToneSchema.parse(m.tone)).not.toThrow();
    }
  });
});
