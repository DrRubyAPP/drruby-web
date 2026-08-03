import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findById, listByUser } from "./hormoneReading.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "hormone-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("hormoneReading.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create + listByUser（最新在前）+ note 可空", async () => {
    const userId = await seedUser();
    await create(userId, {
      marker: "Estradiol",
      value: "45 pg/mL",
      phase: "follicular",
      measuredAt: new Date("2026-06-10T00:00:00Z"),
    });
    const luteal = await create(userId, {
      marker: "Progesterone",
      value: "8 ng/mL",
      phase: "luteal",
      note: "day 21",
      measuredAt: new Date("2026-06-21T00:00:00Z"),
    });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].marker).toBe("Progesterone"); // 最新在前

    const found = await findById(luteal.id);
    expect(found?.note).toBe("day 21");
  });
});
