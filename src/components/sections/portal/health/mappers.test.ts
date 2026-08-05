import { describe, expect, it } from "vitest";
import { mapHormones, mapSignals, mapSkin } from "./mappers";

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
