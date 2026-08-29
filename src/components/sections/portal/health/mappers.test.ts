import { describe, expect, it } from "vitest";
import type { ExtractionConfidence, HealthRecordStatus } from "@/lib/db/enums";
import {
  confidenceKey,
  mapHormones,
  mapSignals,
  mapSkin,
  needsConfirm,
  statusKey,
} from "./mappers";

describe("mapSignals", () => {
  it("joins value+unit and normalizes trend", () => {
    expect(
      mapSignals([
        {
          id: "s1",
          label: "LDL",
          value: "168",
          unit: "mg/dL",
          source: "lab",
          confidence: "possible",
          trend: "up",
        },
      ]),
    ).toEqual([
      {
        id: "s1",
        label: "LDL",
        display: "168 mg/dL",
        source: "lab",
        confidence: "possible",
        trend: "up",
      },
    ]);
  });

  it("no unit → value only; unknown/missing trend → null", () => {
    expect(
      mapSignals([
        {
          id: "s2",
          label: "RHR",
          value: "58",
          source: "watch",
          confidence: "observed",
        },
      ]),
    ).toEqual([
      {
        id: "s2",
        label: "RHR",
        display: "58",
        source: "watch",
        confidence: "observed",
        trend: null,
      },
    ]);
    expect(
      mapSignals([
        {
          id: "s3",
          label: "x",
          value: "1",
          source: "s",
          confidence: "c",
          trend: "sideways",
        },
      ])[0].trend,
    ).toBeNull();
  });

  it("empty array → empty array", () => {
    expect(mapSignals([])).toEqual([]);
  });
});

describe("mapHormones", () => {
  it("passes through fields", () => {
    expect(
      mapHormones([
        {
          id: "h1",
          marker: "E2",
          value: "120",
          phase: "follicular",
          note: "day 5",
        },
      ]),
    ).toEqual([
      {
        id: "h1",
        marker: "E2",
        value: "120",
        phase: "follicular",
        note: "day 5",
      },
    ]);
  });
  it("empty array → empty", () => {
    expect(mapHormones([])).toEqual([]);
  });
});

describe("mapSkin", () => {
  it("null → null (empty-state upstream)", () => {
    expect(mapSkin(null)).toBeNull();
  });
  it("maps date to day + passes zones", () => {
    expect(
      mapSkin({
        date: "2026-07-01T10:20:30.000Z",
        headline: "Improving",
        zones: [{ name: "T-zone", status: "clear" }],
      }),
    ).toEqual({
      date: "2026-07-01",
      headline: "Improving",
      zones: [{ name: "T-zone", status: "clear" }],
    });
  });
});

// =============================================================================
// task-42 T6: Source→Record 状态机 + 置信 + Please confirm（Contract §12/§13）
// =============================================================================

const ALL_STATUSES: HealthRecordStatus[] = [
  "SOURCE_UPLOADED",
  "PROCESSING",
  "EXTRACTED_DRAFT",
  "USER_REVIEW",
  "CONFIRMED",
];

const ALL_CONFIDENCES: ExtractionConfidence[] = [
  "High",
  "Low",
  "Unrecognized",
  "Conflicting",
];

describe("statusKey", () => {
  it("covers every status of the Source→Record state machine", () => {
    // 不漏 status：所有状态机值都要有可读 key
    for (const s of ALL_STATUSES) {
      const key = statusKey(s);
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it("returns i18n key path (relative to `records` namespace) for each status", () => {
    // task-42 T9：mappers 返回 i18n key（非英文字面量），由调用方 t() 解析
    expect(statusKey("SOURCE_UPLOADED")).toBe("status.SOURCE_UPLOADED");
    expect(statusKey("PROCESSING")).toBe("status.PROCESSING");
    expect(statusKey("EXTRACTED_DRAFT")).toBe("status.EXTRACTED_DRAFT");
    expect(statusKey("USER_REVIEW")).toBe("status.USER_REVIEW");
    expect(statusKey("CONFIRMED")).toBe("status.CONFIRMED");
  });
});

describe("confidenceKey", () => {
  it("covers every confidence value", () => {
    for (const c of ALL_CONFIDENCES) {
      const key = confidenceKey(c);
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it("returns i18n key path (relative to `records` namespace) for each confidence", () => {
    // §13：Low/Conflicting 的文案含 "please confirm"——该语义由 i18n value 承载
    // （见 src/i18n/messages/en.json 的 records.confidence.Low / .Conflicting）
    expect(confidenceKey("High")).toBe("confidence.High");
    expect(confidenceKey("Low")).toBe("confidence.Low");
    expect(confidenceKey("Conflicting")).toBe("confidence.Conflicting");
    expect(confidenceKey("Unrecognized")).toBe("confidence.Unrecognized");
  });
});

describe("needsConfirm", () => {
  it("true when pleaseConfirm has entries", () => {
    expect(needsConfirm({ pleaseConfirm: ["mock_field_unverified"] })).toBe(
      true,
    );
    expect(needsConfirm({ pleaseConfirm: ["a", "b"] })).toBe(true);
  });

  it("false when pleaseConfirm empty / missing / undefined", () => {
    expect(needsConfirm({ pleaseConfirm: [] })).toBe(false);
    expect(needsConfirm({})).toBe(false);
    expect(needsConfirm({ pleaseConfirm: undefined })).toBe(false);
  });
});
