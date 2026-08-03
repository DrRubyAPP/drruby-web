import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findById, listByUser } from "./signal.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "signal-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("signal.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create + listByUser（最新在前）", async () => {
    const userId = await seedUser();
    await create(userId, {
      label: "Sleep",
      value: "7h 54m",
      source: "wearable",
      confidence: "observed",
      trend: "up",
      measuredAt: new Date("2026-06-10T00:00:00Z"),
    });
    const ldl = await create(userId, {
      label: "LDL",
      value: "128",
      source: "your doctor",
      confidence: "observed",
      trend: "up",
      measuredAt: new Date("2026-06-12T00:00:00Z"),
    });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe("LDL"); // 最新在前

    const found = await findById(ldl.id);
    expect(found?.value).toBe("128");
  });

  it("拒绝非法 confidence", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        label: "x",
        value: "1",
        source: "you",
        // @ts-expect-error 测试无效值
        confidence: "unknown",
        measuredAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("拒绝非法 trend", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        label: "x",
        value: "1",
        source: "you",
        confidence: "observed",
        // @ts-expect-error 测试无效值
        trend: "sideways",
        measuredAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});
