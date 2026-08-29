import { describe, expect, it } from "vitest";
import type { ExtractionConfidence, HealthRecordStatus } from "@/lib/db/enums";
import {
  confidenceLabel,
  mapHormones,
  mapSignals,
  mapSkin,
  needsConfirm,
  statusLabel,
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

describe("statusLabel", () => {
  it("covers every status of the Source→Record state machine", () => {
    // 不漏 status：所有状态机值都要有可读 label
    for (const s of ALL_STATUSES) {
      const label = statusLabel(s);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("returns expected copy for each status", () => {
    expect(statusLabel("SOURCE_UPLOADED")).toBe("Uploaded");
    expect(statusLabel("PROCESSING")).toBe("Processing…");
    expect(statusLabel("EXTRACTED_DRAFT")).toBe("Draft — review needed");
    expect(statusLabel("USER_REVIEW")).toBe("In review");
    expect(statusLabel("CONFIRMED")).toBe("Confirmed");
  });
});

describe("confidenceLabel", () => {
  it("covers every confidence value", () => {
    for (const c of ALL_CONFIDENCES) {
      const label = confidenceLabel(c);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("marks Low and Conflicting as needing user confirmation (Contract §13)", () => {
    // §13：需核实字段明确标 please confirm，不确定性不得隐藏
    expect(confidenceLabel("High")).toBe("High confidence");
    expect(confidenceLabel("Low")).toContain("please confirm");
    expect(confidenceLabel("Conflicting")).toContain("please confirm");
    expect(confidenceLabel("Unrecognized")).toBe("Unrecognized");
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
