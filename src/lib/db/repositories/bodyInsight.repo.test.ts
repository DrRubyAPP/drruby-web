import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, listByUserAndKind } from "./bodyInsight.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "bodyinsight-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("bodyInsight.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("按 kind 分流 attention / aging_velocity", async () => {
    const userId = await seedUser();
    await create(userId, {
      kind: "attention",
      tag: "Skin",
      title: "Barrier stress",
      body: "Hydration dipped this week",
      accent: "amber",
    });
    await create(userId, {
      kind: "aging_velocity",
      title: "Aging velocity",
      label: "Pace",
      value: "0.9x",
      caption: "Slower than baseline",
      tone: "green",
    });

    const attention = await listByUserAndKind(userId, "attention");
    expect(attention).toHaveLength(1);
    expect(attention[0].accent).toBe("amber");

    const aging = await listByUserAndKind(userId, "aging_velocity");
    expect(aging).toHaveLength(1);
    expect(aging[0].tone).toBe("green");
  });

  it("拒绝非法 kind / accent", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        // @ts-expect-error 测试无效值
        kind: "unknown",
        title: "x",
      }),
    ).rejects.toThrow();
    await expect(
      create(userId, {
        kind: "attention",
        title: "x",
        // @ts-expect-error 测试无效值
        accent: "blue",
      }),
    ).rejects.toThrow();
  });
});
