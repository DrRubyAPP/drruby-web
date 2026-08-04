import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  create,
  listByUserAndKind,
  replaceByUserAndKind,
} from "./bodyInsight.repo";
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

  it("replaceByUserAndKind 幂等替换：先插两条 → 替换为一条 → 只剩一条", async () => {
    const userId = await seedUser();
    await create(userId, { kind: "attention", tag: "a", title: "旧1" });
    await create(userId, { kind: "attention", tag: "b", title: "旧2" });
    expect(await listByUserAndKind(userId, "attention")).toHaveLength(2);

    const written = await replaceByUserAndKind(userId, "attention", [
      { kind: "attention", tag: "c", title: "新", accent: "amber" },
    ]);
    expect(written).toBe(1);

    const rows = await listByUserAndKind(userId, "attention");
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("新");
    expect(rows[0].accent).toBe("amber");
  });

  it("replaceByUserAndKind 只影响目标 kind，不误删其他 kind", async () => {
    const userId = await seedUser();
    await create(userId, {
      kind: "aging_velocity",
      title: "速度",
      label: "Pace",
      value: "1x",
      tone: "green",
    });
    await replaceByUserAndKind(userId, "attention", [
      { kind: "attention", tag: "x", title: "关注" },
    ]);
    expect(await listByUserAndKind(userId, "aging_velocity")).toHaveLength(1);
    expect(await listByUserAndKind(userId, "attention")).toHaveLength(1);
  });

  it("replaceByUserAndKind 空 inputs 清空该 kind，返回 0", async () => {
    const userId = await seedUser();
    await create(userId, { kind: "attention", tag: "a", title: "旧" });
    const written = await replaceByUserAndKind(userId, "attention", []);
    expect(written).toBe(0);
    expect(await listByUserAndKind(userId, "attention")).toHaveLength(0);
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
