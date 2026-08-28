import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  create,
  type DecisionBriefSnapshot,
  findByIdWithEntries,
  listByUser,
  listByUserActionable,
  listByUserHistory,
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
      type: "procedure",
      topic: "Thermage",
      topicSlug: "thermage",
      brief: BRIEF,
    });
    expect(d.brief).toEqual(BRIEF);
    expect(d.goal).toBe("firmness");
    expect(d.type).toBe("procedure");
    expect(d.topic).toBe("Thermage");
    expect(d.topicSlug).toBe("thermage");

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("update 改 lifecycle + brief", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "Try HRT?",
      goal: "sleep-quality",
    });
    const updated = await update(d.id, {
      lifecycle: "DECIDED",
      brief: BRIEF,
      decidedAt: new Date("2026-06-15T00:00:00Z"),
    });
    expect(updated.lifecycle).toBe("DECIDED");
    expect(updated.brief).toEqual(BRIEF);
    expect(updated.decidedAt).not.toBeNull();
  });

  it("findByIdWithEntries 含 append-only entries（正序）", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "Botox?",
      goal: "even-tone",
    });
    await append({
      decisionId: d.id,
      userId,
      text: "Booked consult",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await append({
      decisionId: d.id,
      userId,
      text: "Started",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-05T00:00:00Z"),
    });
    const withEntries = await findByIdWithEntries(d.id);
    expect(withEntries?.entries).toHaveLength(2);
    expect(withEntries?.entries[0].text).toBe("Booked consult"); // 正序
  });

  it("拒绝非法 outcome 组合（B1）", async () => {
    const userId = await seedUser();
    // action kind 传 B 集 outcome → 拒绝
    await expect(
      create(userId, {
        question: "action+B outcome",
        decisionKind: "action",
        outcome: "keep_exploring",
      }),
    ).rejects.toThrow();
    // unconfirmed 传非 null outcome → 拒绝
    await expect(
      create(userId, {
        question: "unconfirmed+outcome",
        decisionKind: "unconfirmed",
        outcome: "still_considering",
      }),
    ).rejects.toThrow();
  });

  it("create 缺省 → lifecycle=ACTIVE、decisionKind=unconfirmed、outcome=null、activity 非空", async () => {
    const userId = await seedUser();
    const d = await create(userId, { question: "Try Thermage?" });
    expect(d.goal).toBeNull();
    expect(d.lifecycle).toBe("ACTIVE");
    expect(d.decisionKind).toBe("unconfirmed");
    expect(d.outcome).toBeNull();
    expect(d.saved).toBe(false);
    expect(d.yourselfContext).toBeNull();
    expect(d.lastUserActivityAt).not.toBeNull();
  });

  it("create 幂等：60s 内同 userId+question 复用同一行（§31）", async () => {
    const userId = await seedUser();
    const a = await create(userId, { question: "same question" });
    const b = await create(userId, { question: "same question" });
    expect(b.id).toBe(a.id);
    // 不同 question 不去重
    const c = await create(userId, { question: "different question" });
    expect(c.id).not.toBe(a.id);
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
  });

  it("update 可写 saved + yourselfContext", async () => {
    const userId = await seedUser();
    const d = await create(userId, { question: "Try HRT?" });
    const updated = await update(d.id, {
      saved: true,
      yourselfContext: "Perimenopausal, considering HRT for sleep.",
    });
    expect(updated.saved).toBe(true);
    expect(updated.yourselfContext).toBe(
      "Perimenopausal, considering HRT for sleep.",
    );
  });

  it("listByUserActionable 排除 CLOSED/COMPLETED；listByUserHistory 仅含它们", async () => {
    const userId = await seedUser();
    const active = await create(userId, { question: "active one" });
    const closed = await create(userId, { question: "closed one" });
    const completed = await create(userId, { question: "completed one" });
    await update(closed.id, { lifecycle: "CLOSED" });
    await update(completed.id, { lifecycle: "COMPLETED" });

    const actionable = await listByUserActionable(userId);
    expect(actionable.map((r) => r.id)).toEqual([active.id]);

    const history = await listByUserHistory(userId);
    expect(history.map((r) => r.id).sort()).toEqual(
      [closed.id, completed.id].sort(),
    );
  });

  it("saved 不影响 Actionable 可见性（§11 纯书签）", async () => {
    const userId = await seedUser();
    const a = await create(userId, { question: "saved but active" });
    await create(userId, { question: "not saved but active" });
    await update(a.id, { saved: true });

    // 两条都 ACTIVE → 都在 Actionable，与 saved 无关
    const rows = await listByUserActionable(userId);
    expect(rows).toHaveLength(2);
  });

  it("meaningful activity：改 yourselfContext 抬升 lastUserActivityAt；改 saved 不抬升（§8/§11）", async () => {
    const userId = await seedUser();
    const d = await create(userId, { question: "activity check" });
    const t0 = d.lastUserActivityAt.getTime();

    const bumped = await update(d.id, { yourselfContext: "some context" });
    expect(bumped.lastUserActivityAt.getTime()).toBeGreaterThanOrEqual(t0);
    const t1 = bumped.lastUserActivityAt.getTime();

    const savedOnly = await update(d.id, { saved: true });
    // saved 非 meaningful：activity 不再抬升
    expect(savedOnly.lastUserActivityAt.getTime()).toBe(t1);
  });

  it("append 后父 Decision lastUserActivityAt 被 bump（§8）", async () => {
    const userId = await seedUser();
    const d = await create(userId, { question: "append bumps activity" });
    const t0 = d.lastUserActivityAt.getTime();
    await append({
      decisionId: d.id,
      userId,
      text: "New observation",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    const after = await findByIdWithEntries(d.id);
    expect(after?.lastUserActivityAt.getTime()).toBeGreaterThanOrEqual(t0);
  });
});
