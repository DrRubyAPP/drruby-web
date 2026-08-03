import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findById, list } from "./researchStudy.repo";
import { resetDatabase } from "./test-helpers";

describe("researchStudy.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create（全局目录，无 userId）+ list + findById", async () => {
    const s = await create({
      name: "Menopause Skin Study",
      description: "Tracking barrier changes",
      irbNumber: "IRB-2026-001",
      recruitmentStatus: "recruiting",
      fields: ["skin_scan", "hormone"],
    });
    expect(s.fields).toEqual(["skin_scan", "hormone"]);

    const all = await list();
    expect(all).toHaveLength(1);

    const found = await findById(s.id);
    expect(found?.name).toBe("Menopause Skin Study");
  });

  it("拒绝非法 recruitmentStatus", async () => {
    await expect(
      create({
        name: "x",
        // @ts-expect-error 测试无效值
        recruitmentStatus: "open",
      }),
    ).rejects.toThrow();
  });
});
