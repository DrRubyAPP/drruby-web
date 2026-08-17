import { describe, expect, it } from "vitest";
import type { BodyInsight, SkinScan } from "~prisma/client";
import {
  accentLevel,
  buildBodyFindings,
  buildSkinFindings,
  statusLevel,
  toneLevel,
} from "./rules";

function fakeScan(zones: unknown): SkinScan {
  return { zones } as unknown as SkinScan;
}

function fakeInsight(o: Partial<BodyInsight>): BodyInsight {
  return o as BodyInsight;
}

describe("statusLevel（skin zone status 宽容映射）", () => {
  it("good/healthy/clear/stable → good", () => {
    expect(statusLevel("Good")).toBe("good");
    expect(statusLevel("healthy")).toBe("good");
    expect(statusLevel("clear")).toBe("good");
    expect(statusLevel("stable")).toBe("good");
  });

  it("alert/concern/risk/worse/bad → alert", () => {
    expect(statusLevel("Alert")).toBe("alert");
    expect(statusLevel("needs attention")).toBe("alert");
    expect(statusLevel("concern")).toBe("alert");
    expect(statusLevel("worse")).toBe("alert");
  });

  it("未知值 → warn（不抛错）", () => {
    expect(statusLevel("dehydrated")).toBe("warn");
    expect(statusLevel("whatever")).toBe("warn");
  });
});

describe("accentLevel / toneLevel", () => {
  it("red→alert，amber/purple/null→warn", () => {
    expect(accentLevel("red")).toBe("alert");
    expect(accentLevel("amber")).toBe("warn");
    expect(accentLevel("purple")).toBe("warn");
    expect(accentLevel(null)).toBe("warn");
  });

  it("green→good，amber/purple/null→warn", () => {
    expect(toneLevel("green")).toBe("good");
    expect(toneLevel("amber")).toBe("warn");
    expect(toneLevel(null)).toBe("warn");
  });
});

describe("buildSkinFindings", () => {
  it("按 zone 产出 level/tag/title/desc", () => {
    const findings = buildSkinFindings(
      fakeScan([
        { name: "额头", status: "stable" },
        { name: "下颌线", status: "concern" },
      ]),
    );

    expect(findings).toHaveLength(2);
    expect(findings[0]).toEqual({
      level: "good",
      tag: "额头",
      title: "额头：stable",
      desc: "最近一次扫描中该区域状态为 stable。",
    });
    expect(findings[1].level).toBe("alert");
    expect(findings[1].tag).toBe("下颌线");
  });

  it("zones JSON 形状不符（null / 非数组 / 字段缺失）→ 空数组不抛错", () => {
    expect(buildSkinFindings(fakeScan(null))).toEqual([]);
    expect(buildSkinFindings(fakeScan("not-array"))).toEqual([]);
    expect(
      buildSkinFindings(
        fakeScan([{ name: "只有名字" }, { status: "只有状态" }, null]),
      ),
    ).toEqual([]);
  });
});

describe("buildBodyFindings", () => {
  it("attention 用 accent 映射，tag 缺省 fallback 'attention'", () => {
    const [finding] = buildBodyFindings(
      [fakeInsight({ title: "睡眠不足", body: "连续走低", accent: "red" })],
      [],
    );

    expect(finding.level).toBe("alert");
    expect(finding.tag).toBe("attention");
    expect(finding.title).toBe("睡眠不足");
    expect(finding.desc).toBe("连续走低");
  });

  it("attention 有 tag 时用传入值", () => {
    const [finding] = buildBodyFindings(
      [fakeInsight({ title: "t", body: "b", accent: "amber", tag: "sleep" })],
      [],
    );
    expect(finding.tag).toBe("sleep");
    expect(finding.level).toBe("warn");
  });

  it("aging 用 tone 映射，tag ← label ?? 'aging'，desc ← caption ?? title", () => {
    const [withLabel, noLabel] = buildBodyFindings(
      [],
      [
        fakeInsight({
          title: "t1",
          label: "胶原",
          value: "-12%",
          caption: "下降",
          tone: "green",
        }),
        fakeInsight({ title: "兜底标题", tone: null }),
      ],
    );

    expect(withLabel).toEqual({
      level: "good",
      tag: "胶原",
      title: "胶原：-12%",
      desc: "下降",
    });
    expect(noLabel.tag).toBe("aging");
    expect(noLabel.level).toBe("warn");
    expect(noLabel.desc).toBe("兜底标题");
  });
});
