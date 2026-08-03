import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, listByUser, updateStatus } from "./experiment.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "experiment-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("experiment.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create + listByUser + updateStatus", async () => {
    const userId = await seedUser();
    const e = await create(userId, {
      title: "Retinol nightly",
      hypothesis: "Reduces fine lines in 8 weeks",
      status: "planned",
      window: "8 weeks",
    });
    expect(e.status).toBe("planned");

    const running = await updateStatus(e.id, "running");
    expect(running.status).toBe("running");

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("拒绝非法 status", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        title: "x",
        hypothesis: "y",
        // @ts-expect-error 测试无效值
        status: "in-progress",
        window: "1 week",
      }),
    ).rejects.toThrow();
  });
});
