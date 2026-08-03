import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findLatest } from "./skinScan.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "skinscan-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("skinScan.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create（zones JSON 往返）+ findLatest 取最新", async () => {
    const userId = await seedUser();
    await create(userId, {
      scannedAt: new Date("2026-05-01T00:00:00Z"),
      headline: "Balanced",
      zones: [{ name: "Cheeks", status: "Normal" }],
    });
    await create(userId, {
      scannedAt: new Date("2026-06-01T00:00:00Z"),
      headline: "Drier zones",
      zones: [{ name: "Cheeks", status: "Drier than usual" }],
    });

    const latest = await findLatest(userId);
    expect(latest?.headline).toBe("Drier zones");
    expect(latest?.zones).toEqual([
      { name: "Cheeks", status: "Drier than usual" },
    ]);
  });

  it("无扫描返回 null", async () => {
    const userId = await seedUser();
    expect(await findLatest(userId)).toBeNull();
  });
});
