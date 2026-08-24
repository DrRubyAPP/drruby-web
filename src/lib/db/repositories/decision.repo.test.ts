import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  create,
  type DecisionBriefSnapshot,
  findByIdWithEntries,
  listByUser,
  update,
} from "./decision.repo";
import { append } from "./decisionEntry.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "decision-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

const BRIEF: DecisionBriefSnapshot = {
  yourHistory: ["Considered laser in 2025"],
  similarJourneys: { summary: "12 similar users", note: "Most paused" },
  evidence: { known: ["Effective for texture"], uncertain: ["Long-term"] },
  questionsForClinician: ["Downtime?"],
};

describe("decision.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create（brief JSON 往返）+ listByUser", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "Try Thermage?",
      goal: "firmness",
      status: "considering",
      type: "thermage",
      brief: BRIEF,
    });
    expect(d.brief).toEqual(BRIEF);
    expect(d.goal).toBe("firmness");

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("update 改状态 + brief", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "Try HRT?",
      goal: "sleep-quality",
      status: "considering",
    });
    const updated = await update(d.id, {
      status: "decided",
      brief: BRIEF,
      decidedAt: new Date("2026-06-15T00:00:00Z"),
    });
    expect(updated.status).toBe("decided");
    expect(updated.brief).toEqual(BRIEF);
    expect(updated.decidedAt).not.toBeNull();
  });

  it("findByIdWithEntries 含 append-only entries（正序）", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "Botox?",
      goal: "even-tone",
      status: "in-progress",
    });
    await append({
      decisionId: d.id,
      userId,
      text: "Booked consult",
      statusSnapshot: "considering",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await append({
      decisionId: d.id,
      userId,
      text: "Started",
      statusSnapshot: "in-progress",
      occurredAt: new Date("2026-06-05T00:00:00Z"),
    });
    const withEntries = await findByIdWithEntries(d.id);
    expect(withEntries?.entries).toHaveLength(2);
    expect(withEntries?.entries[0].text).toBe("Booked consult"); // 正序
  });

  it("拒绝非法 status", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        question: "x",
        goal: "firmness",
        // @ts-expect-error 测试无效值
        status: "done",
      }),
    ).rejects.toThrow();
  });
});
