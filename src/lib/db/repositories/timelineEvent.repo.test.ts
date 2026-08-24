import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import { resetDatabase } from "./test-helpers";
import { create, listByDecision, listByUser } from "./timelineEvent.repo";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "timeline-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("timelineEvent.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create + listByUser（最新在前）", async () => {
    const userId = await seedUser();
    await create(userId, {
      kind: "note",
      title: "Started tracking",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await create(userId, {
      kind: "treatment",
      title: "First session",
      source: "your doctor",
      occurredAt: new Date("2026-06-10T00:00:00Z"),
    });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("First session"); // 最新在前
  });

  it("listByDecision 只返回该决策关联事件（正序）", async () => {
    const userId = await seedUser();
    const decision = await createDecision(userId, {
      question: "Try HRT?",
      goal: "sleep-quality",
      status: "considering",
    });
    await create(userId, {
      kind: "decision",
      title: "Considered",
      decisionId: decision.id,
      occurredAt: new Date("2026-06-02T00:00:00Z"),
    });
    await create(userId, {
      kind: "note",
      title: "Unrelated",
      occurredAt: new Date("2026-06-03T00:00:00Z"),
    });
    const rows = await listByDecision(decision.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Considered");
  });

  it("拒绝非法 kind", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        // @ts-expect-error 测试无效值
        kind: "milestone",
        title: "x",
        occurredAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});
