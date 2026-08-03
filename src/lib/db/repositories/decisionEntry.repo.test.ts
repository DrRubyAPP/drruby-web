import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import { append, listByDecision } from "./decisionEntry.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seed(): Promise<{ userId: string; decisionId: string }> {
  const u = await createUser({
    email: "decision-entry-test@example.com",
    authProvider: "email",
    role: "user",
  });
  const d = await createDecision(u.id, {
    question: "Try filler?",
    status: "considering",
  });
  return { userId: u.id, decisionId: d.id };
}

describe("decisionEntry.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("append-only：两次 append 得两行，内容不被覆盖", async () => {
    const { userId, decisionId } = await seed();
    await append({
      decisionId,
      userId,
      text: "Initial thought",
      statusSnapshot: "considering",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await append({
      decisionId,
      userId,
      text: "Changed my mind",
      statusSnapshot: "paused",
      occurredAt: new Date("2026-06-08T00:00:00Z"),
    });
    const rows = await listByDecision(decisionId);
    expect(rows).toHaveLength(2);
    expect(rows[0].text).toBe("Initial thought"); // 正序，原始记录保留
    expect(rows[1].text).toBe("Changed my mind");
  });

  it("拒绝非法 statusSnapshot", async () => {
    const { userId, decisionId } = await seed();
    await expect(
      append({
        decisionId,
        userId,
        text: "x",
        // @ts-expect-error 测试无效值
        statusSnapshot: "archived",
        occurredAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});
