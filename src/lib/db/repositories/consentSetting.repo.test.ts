import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { listByUser, setValue, upsert } from "./consentSetting.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "consent-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("consentSetting.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("同 (userId,key) 二次 upsert 更新非新建", async () => {
    const userId = await seedUser();
    const first = await upsert(userId, {
      key: "deidentified_contribution",
      title: "De-identified contribution",
      description: "Share anonymized data",
      value: false,
    });
    const second = await upsert(userId, {
      key: "deidentified_contribution",
      title: "De-identified contribution",
      description: "Share anonymized data",
      value: true,
    });
    expect(second.id).toBe(first.id);
    expect(second.value).toBe(true);

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("locked 档 setValue 抛错", async () => {
    const userId = await seedUser();
    const self = await upsert(userId, {
      key: "self",
      title: "Your eyes only",
      description: "Always on",
      value: true,
      locked: true,
    });
    await expect(setValue(self.id, false)).rejects.toThrow();
  });

  it("非 locked 档可切换", async () => {
    const userId = await seedUser();
    const row = await upsert(userId, {
      key: "identified_research",
      title: "Identified research",
      description: "Join named studies",
      value: false,
    });
    const toggled = await setValue(row.id, true);
    expect(toggled.value).toBe(true);
  });

  it("拒绝非法 key", async () => {
    const userId = await seedUser();
    await expect(
      upsert(userId, {
        // @ts-expect-error 测试无效值
        key: "public",
        title: "x",
        description: "y",
        value: true,
      }),
    ).rejects.toThrow();
  });
});
