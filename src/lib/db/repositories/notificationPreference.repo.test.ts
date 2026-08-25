import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { listByUser, setEnabled } from "./notificationPreference.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "notif-pref-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("notificationPreference.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("listByUser 空表返回 []", async () => {
    const userId = await seedUser();
    expect(await listByUser(userId)).toEqual([]);
  });

  it("setEnabled 创建 + 幂等 upsert", async () => {
    const userId = await seedUser();

    const first = await setEnabled(userId, "weekly_digest", false);
    expect(first.enabled).toBe(false);

    // 再写同 key：update 而非新行
    const second = await setEnabled(userId, "weekly_digest", true);
    expect(second.enabled).toBe(true);

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("weekly_digest");
  });

  it("多 key 各自独立行", async () => {
    const userId = await seedUser();
    await setEnabled(userId, "weekly_digest", false);
    await setEnabled(userId, "decision_followups", false);

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
  });

  it("拒绝非法 key", async () => {
    const userId = await seedUser();
    await expect(
      // @ts-expect-error 测试无效值
      setEnabled(userId, "not-a-key", true),
    ).rejects.toThrow();
  });
});
