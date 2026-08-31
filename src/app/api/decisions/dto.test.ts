import { describe, expect, it } from "vitest";
import type { Decision, DecisionEntry } from "~prisma/client";
import {
  DecisionDTO,
  DecisionEntryDTO,
  toDecisionDTO,
  toEntryDTO,
} from "./dto";

/** 构造最小 Decision 行（覆盖 task-44 新增字段） */
function makeDecisionRow(overrides: Partial<Decision> = {}): Decision {
  return {
    id: "dec1",
    userId: "u1",
    question: "Try Thermage?",
    goal: null,
    type: "procedure",
    topic: "Thermage",
    topicSlug: "thermage",
    lifecycle: "DECIDED",
    decisionKind: "action",
    outcome: "decided_to_do_it",
    nextStep: null,
    lastUserActivityAt: new Date("2026-08-31T00:00:00Z"),
    brief: null,
    saved: false,
    yourselfContext: null,
    decidedAt: new Date("2026-08-30T00:00:00Z"),
    freshnessCheckedAt: null,
    // task-43
    currentSnapshotId: null,
    healthContext: null,
    healthContextStatus: null,
    healthContextConfirmedAt: null,
    pendingRegenAt: null,
    // task-44
    nextCheckInAt: new Date("2026-09-07T00:00:00Z"),
    observeBaseline: {
      text: "baseline text",
      baselineRecordId: "rec1",
      freq: "weekly",
    },
    createdAt: new Date("2026-08-01T00:00:00Z"),
    updatedAt: new Date("2026-08-31T00:00:00Z"),
    ...overrides,
  } as unknown as Decision;
}

describe("task-44 DecisionDTO/EntryDTO 新字段", () => {
  it("DecisionDTO 包含 nextCheckInAt + observeBaseline schema 字段", () => {
    const shape = DecisionDTO.shape;
    expect(shape.nextCheckInAt).toBeDefined();
    expect(shape.observeBaseline).toBeDefined();
  });

  it("DecisionEntryDTO 包含 direction schema 字段", () => {
    const shape = DecisionEntryDTO.shape;
    expect(shape.direction).toBeDefined();
  });

  it("toDecisionDTO 输出 nextCheckInAt ISO + observeBaseline 对象", () => {
    const row = makeDecisionRow();
    const dto = toDecisionDTO(row, { withBrief: false });
    expect(dto.nextCheckInAt).toBe("2026-09-07T00:00:00.000Z");
    expect(dto.observeBaseline).toEqual({
      text: "baseline text",
      baselineRecordId: "rec1",
      freq: "weekly",
    });
  });

  it("toDecisionDTO nextCheckInAt=null/observeBaseline=null 安全透传", () => {
    const row = makeDecisionRow({
      nextCheckInAt: null,
      observeBaseline: null,
    });
    const dto = toDecisionDTO(row, { withBrief: false });
    expect(dto.nextCheckInAt).toBeNull();
    expect(dto.observeBaseline).toBeNull();
  });

  it("toEntryDTO 输出 direction 字段（合法值）", () => {
    const row = {
      id: "e1",
      decisionId: "dec1",
      userId: "u1",
      text: "feeling better",
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      direction: "better",
      synthesis: null,
      occurredAt: new Date("2026-09-01T00:00:00Z"),
      createdAt: new Date("2026-09-01T00:00:00Z"),
    } as unknown as DecisionEntry;
    const dto = toEntryDTO(row);
    expect(dto.direction).toBe("better");
    expect(dto.kind).toBe("observation");
  });

  it("toEntryDTO direction=null 透传 null", () => {
    const row = {
      id: "e1",
      decisionId: "dec1",
      userId: "u1",
      text: "no direction observation",
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      direction: null,
      synthesis: null,
      occurredAt: new Date("2026-09-01T00:00:00Z"),
      createdAt: new Date("2026-09-01T00:00:00Z"),
    } as unknown as DecisionEntry;
    const dto = toEntryDTO(row);
    expect(dto.direction).toBeNull();
  });

  it("toEntryDTO direction=非法值 → 安全降级 null（不破坏响应）", () => {
    const row = {
      id: "e1",
      decisionId: "dec1",
      userId: "u1",
      text: "bad direction",
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      direction: "improving",
      synthesis: null,
      occurredAt: new Date("2026-09-01T00:00:00Z"),
      createdAt: new Date("2026-09-01T00:00:00Z"),
    } as unknown as DecisionEntry;
    const dto = toEntryDTO(row);
    expect(dto.direction).toBeNull();
  });
});
