import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, listByUser, setShared } from "./contribution.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "contribution-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("contribution.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create 默认未分享", async () => {
    const userId = await seedUser();
    const c = await create(userId, {
      title: "Skin scans",
      description: "Monthly facial scans",
    });
    expect(c.shared).toBe(false);
    expect(c.sharedAt).toBeNull();

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("setShared opt-in 后可撤回（记录 sharedAt / withdrawnAt）", async () => {
    const userId = await seedUser();
    const c = await create(userId, {
      title: "Labs",
      description: "Blood panels",
    });

    const shared = await setShared(c.id, true);
    expect(shared.shared).toBe(true);
    expect(shared.sharedAt).not.toBeNull();
    expect(shared.withdrawnAt).toBeNull();

    const withdrawn = await setShared(c.id, false);
    expect(withdrawn.shared).toBe(false);
    expect(withdrawn.withdrawnAt).not.toBeNull();
  });
});
