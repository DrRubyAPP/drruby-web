import { describe, expect, it } from "vitest";
import { detectMaterialChange } from "./material";
import type { ConnectedRecordRef, HealthContext } from "./types";

function makeRecord(
  overrides: Partial<ConnectedRecordRef>,
): ConnectedRecordRef {
  return {
    id: "rec1",
    kind: "lab",
    documentClass: "Lab",
    summary: "Estradiol 50",
    ...overrides,
  };
}

const HC_A: HealthContext = {
  symptoms: "hot flashes",
  medications_treatments: "none",
  related_health_changes: "perimenopause",
};

describe("MaterialDetector (D4 信息类别 diff)", () => {
  it("新 documentClass 桶出现 → material（同 kind 也算）", () => {
    const prevRecords = [makeRecord({ id: "r1", documentClass: "Lab" })];
    const newRecords = [
      makeRecord({ id: "r1", documentClass: "Lab" }),
      makeRecord({ id: "r2", documentClass: "Imaging", kind: "imaging" }),
    ];
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: false,
    });
    expect(result.material).toBe(true);
    expect(result.reason).toMatch(/new|imaging|category/i);
  });

  it("同类别新增支持证据（同 kind+documentClass，无值变化）→ 非 material", () => {
    const prevRecords = [
      makeRecord({ id: "r1", documentClass: "Lab", summary: "Estradiol 50" }),
    ];
    const newRecords = [
      makeRecord({ id: "r1", documentClass: "Lab", summary: "Estradiol 50" }),
      // 新增同类别同 kind 的 supporting evidence（不同 id 但同桶）
      makeRecord({ id: "r2", documentClass: "Lab", summary: "FSH 80" }),
    ];
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: false,
    });
    // D4/§22：同类别新增支持证据 ≠ material
    expect(result.material).toBe(false);
  });

  it("同类别但值变化（normal → abnormal）→ material", () => {
    const prevRecords = [
      makeRecord({
        id: "r1",
        documentClass: "Lab",
        summary: "Estradiol 50 (normal)",
      }),
    ];
    const newRecords = [
      // 同 id 但 summary 变了（值变化）
      makeRecord({
        id: "r1",
        documentClass: "Lab",
        summary: "Estradiol 200 (abnormal)",
      }),
    ];
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: false,
    });
    expect(result.material).toBe(true);
    expect(result.reason).toMatch(/value|change/i);
  });

  it("healthContext 类别变化 → material", () => {
    const prevRecords = [makeRecord({ id: "r1" })];
    const newRecords = [makeRecord({ id: "r1" })];
    const newHC: HealthContext = {
      ...HC_A,
      symptoms: "hot flashes + night sweats", // symptoms 类别内容变
    };
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: newHC,
      corpusVersionChanged: false,
    });
    expect(result.material).toBe(true);
    expect(result.reason).toMatch(/health context|category/i);
  });

  it("corpus 版本变 → material", () => {
    const prevRecords = [makeRecord({ id: "r1" })];
    const newRecords = [makeRecord({ id: "r1" })];
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: true,
    });
    expect(result.material).toBe(true);
    expect(result.reason).toMatch(/corpus/i);
  });

  it("全无变化 → 非 material", () => {
    const prevRecords = [makeRecord({ id: "r1" })];
    const newRecords = [makeRecord({ id: "r1" })];
    const result = detectMaterialChange({
      prevConnectedRecords: prevRecords,
      newConnectedRecords: newRecords,
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: false,
    });
    expect(result.material).toBe(false);
  });

  it("prevSnapshot 无 Records（首次建 Snapshot 后第二次 regen）→ 新增 Records 即 material", () => {
    // 首次建 Snapshot 时 prevConnectedRecords=[], regen 时 newRecords=[r1] → 新桶 → material
    const result = detectMaterialChange({
      prevConnectedRecords: [],
      newConnectedRecords: [makeRecord({ id: "r1" })],
      prevHealthContext: HC_A,
      newHealthContext: HC_A,
      corpusVersionChanged: false,
    });
    expect(result.material).toBe(true);
  });
});
