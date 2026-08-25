import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { findByIdWithUpdates, list } from "./journey.repo";
import { resetDatabase } from "./test-helpers";

/** 直接用 prisma 造全局 journey 数据（Journey 不挂用户） */
async function seedJourney(data: {
  id: string;
  summary: string;
  sourceType: string;
  decisionType?: string | null;
  shared?: boolean;
  withdrawnAt?: Date | null;
}) {
  return prisma.journey.create({
    data: {
      id: data.id,
      decisionType: data.decisionType ?? null,
      summary: data.summary,
      sourceType: data.sourceType,
      shared: data.shared ?? true,
      withdrawnAt: data.withdrawnAt ?? null,
    },
  });
}

describe("journey.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("list 默认只返回 shared=true 且 withdrawnAt=null", async () => {
    await seedJourney({
      id: "j-shared",
      summary: "Shared journey",
      sourceType: "verified_member",
    });
    await seedJourney({
      id: "j-unshared",
      summary: "Unshared journey",
      sourceType: "verified_member",
      shared: false,
    });
    await seedJourney({
      id: "j-withdrawn",
      summary: "Withdrawn journey",
      sourceType: "partner_clinic",
      withdrawnAt: new Date(),
    });

    const rows = await list();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("j-shared");
  });

  it("list 按 decisionType 筛选", async () => {
    await seedJourney({
      id: "j-thermage",
      summary: "Thermage journey",
      sourceType: "verified_member",
      decisionType: "thermage",
    });
    await seedJourney({
      id: "j-hrt",
      summary: "HRT journey",
      sourceType: "research_study",
      decisionType: "hrt",
    });

    const rows = await list({ decisionType: "thermage" });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("j-thermage");
  });

  it("list 拒绝非法 decisionType", async () => {
    await expect(
      // @ts-expect-error 测试无效值
      list({ decisionType: "not-a-type" }),
    ).rejects.toThrow();
  });

  it("findByIdWithUpdates 含 version 正序 updates", async () => {
    const j = await seedJourney({
      id: "j-with-updates",
      summary: "Living journey",
      sourceType: "founder_interview",
    });
    await prisma.journeyUpdate.create({
      data: {
        journeyId: j.id,
        version: 2,
        note: "Month 6: still happy",
      },
    });
    await prisma.journeyUpdate.create({
      data: {
        journeyId: j.id,
        version: 1,
        note: "Month 3: subtle firmness",
      },
    });

    const row = await findByIdWithUpdates(j.id);
    expect(row?.summary).toBe("Living journey");
    expect(row?.updates).toHaveLength(2);
    expect(row?.updates[0].version).toBe(1); // 正序
    expect(row?.updates[1].version).toBe(2);
  });

  it("findByIdWithUpdates 未命中返回 null", async () => {
    expect(await findByIdWithUpdates("nope")).toBeNull();
  });
});
