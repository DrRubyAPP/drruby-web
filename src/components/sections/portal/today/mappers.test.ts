import { describe, expect, it } from "vitest";
import { mapAging, mapAttention } from "./mappers";

describe("mapAttention", () => {
  it("passes through fields and flags hasBody=true for normal item", () => {
    expect(
      mapAttention([
        {
          id: "a1",
          tag: "SLEEP",
          title: "Sleep slipped before your period",
          body: "Your sleep shortened 3 nights before each of the last 3 cycles.",
          accent: "purple",
        },
      ]),
    ).toEqual([
      {
        id: "a1",
        tag: "SLEEP",
        title: "Sleep slipped before your period",
        body: "Your sleep shortened 3 nights before each of the last 3 cycles.",
        accent: "purple",
        hasBody: true,
      },
    ]);
  });

  it("empty body (degraded polish) → hasBody=false, body kept as ''", () => {
    expect(
      mapAttention([
        { id: "a2", tag: "", title: "Pattern", body: "", accent: "amber" },
      ]),
    ).toEqual([
      { id: "a2", tag: "", title: "Pattern", body: "", accent: "amber", hasBody: false },
    ]);
  });

  it("whitespace-only body → hasBody=false", () => {
    expect(
      mapAttention([
        { id: "a3", tag: "x", title: "t", body: "   ", accent: "red" },
      ])[0].hasBody,
    ).toBe(false);
  });

  it("empty array → empty array (空写)", () => {
    expect(mapAttention([])).toEqual([]);
  });

  it("accent enum values (red/amber/purple) all pass through", () => {
    const accents = ["red", "amber", "purple"] as const;
    const out = mapAttention(
      accents.map((a, i) => ({
        id: `a${i}`,
        tag: "",
        title: "t",
        body: "b",
        accent: a,
      })),
    );
    expect(out.map((o) => o.accent)).toEqual([...accents]);
  });
});

describe("mapAging", () => {
  it("passes through fields and flags hasCaption=true for normal item", () => {
    expect(
      mapAging([
        {
          id: "g1",
          label: "Sleep age",
          value: "+2.3 yrs",
          caption: "Slowing 3 nights before each of the last 3 cycles.",
          tone: "amber",
        },
      ]),
    ).toEqual([
      {
        id: "g1",
        label: "Sleep age",
        value: "+2.3 yrs",
        caption: "Slowing 3 nights before each of the last 3 cycles.",
        tone: "amber",
        hasCaption: true,
      },
    ]);
  });

  it("empty caption (degraded polish) → hasCaption=false", () => {
    expect(
      mapAging([
        { id: "g2", label: "LDL", value: "168", caption: "", tone: "green" },
      ])[0].hasCaption,
    ).toBe(false);
  });

  it("empty array → empty array (空写)", () => {
    expect(mapAging([])).toEqual([]);
  });

  it("tone enum values (green/amber/purple) all pass through", () => {
    const tones = ["green", "amber", "purple"] as const;
    const out = mapAging(
      tones.map((t, i) => ({
        id: `g${i}`,
        label: "l",
        value: "v",
        caption: "c",
        tone: t,
      })),
    );
    expect(out.map((o) => o.tone)).toEqual([...tones]);
  });
});
