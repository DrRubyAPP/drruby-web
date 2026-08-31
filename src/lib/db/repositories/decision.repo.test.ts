import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  completeAfterLearning,
  create,
  type DecisionBriefSnapshot,
  findByIdWithEntries,
  listByUser,
  listByUserActionable,
  listByUserHistory,
  listDueForCheckIn,
  markCompleted,
  reopenAtomic,
  startObserving,
  stopObserving,
  update,
} from "./decision.repo";
import { append, listByDecision } from "./decisionEntry.repo";
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

describe("task-41 reopenAtomic", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  async function seedClosedWithBrief(
    email: string,
  ): Promise<{ userId: string; decisionId: string }> {
    const userId = await seedUser();
    // 直接造 CLOSED 决策并写 brief + decidedAt（不走 create 校验路径）
    const d = await prisma.decision.create({
      data: {
        userId,
        question: "Reopen me",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
        decidedAt: new Date("2026-01-01T00:00:00Z"),
        brief: {
          yourHistory: ["fine lines"],
          similarJourneys: { summary: "x", note: "y" },
          evidence: { known: [], uncertain: [] },
          questionsForClinician: [],
        } as never,
      },
    });
    return { userId, decisionId: d.id };
  }

  it("archives outcome + synthesis (deep brief copy) and clears outcome/nextStep/decidedAt, sets ACTIVE", async () => {
    const { userId, decisionId } = await seedClosedWithBrief(
      "reopen-1@example.com",
    );

    const row = await reopenAtomic(decisionId, userId);
    expect(row.lifecycle).toBe("ACTIVE");
    expect(row.outcome).toBeNull();
    expect(row.nextStep).toBeNull();
    expect(row.decidedAt).toBeNull();

    const entries = await listByDecision(decisionId);
    const archived = entries.find((e) => e.kind === "archived_outcome");
    expect(archived).toBeTruthy();
    expect(archived?.lifecycleSnapshot).toBe("CLOSED");
    expect(archived?.synthesis).toMatchObject({
      outcome: "decided_not_to",
      nextStep: null,
      brief: { yourHistory: ["fine lines"] },
    });
  });

  it("D6: does NOT write freshnessCheckedAt（不主动 set；旧值保留）", async () => {
    const userId = await seedUser();
    const d = await create(userId, {
      question: "freshness untouched",
      decisionKind: "action",
      outcome: "decided_not_to",
      lifecycle: "CLOSED",
    });
    // 预置旧 freshnessCheckedAt
    await update(d.id, {
      freshnessCheckedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const row = await reopenAtomic(d.id, userId);
    // Reopen 不主动写；旧值保留（gate 校验仍会因 archived.occurredAt > 旧值而拒）
    expect(row.freshnessCheckedAt).not.toBeNull();
    expect(row.freshnessCheckedAt?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
});

describe("task-44 startObserving/stopObserving/markCompleted/completeAfterLearning", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  async function seedUser(email = "task44-dec@example.com"): Promise<string> {
    const u = await createUser({
      email,
      authProvider: "email",
      role: "user",
    });
    return u.id;
  }

  /** 直接造一个 DECIDED decision（不走 create 校验路径，节省步骤） */
  async function seedDecidedDecision(
    userId: string,
    question = "Try Thermage?",
  ): Promise<string> {
    const d = await prisma.decision.create({
      data: {
        userId,
        question,
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
      },
    });
    return d.id;
  }

  it("startObserving: DECIDED → OBSERVING, 设 nextCheckInAt + observeBaseline + TimelineEvent", async () => {
    const userId = await seedUser("start-ok@example.com");
    const decisionId = await seedDecidedDecision(userId);

    const row = await startObserving({
      decisionId,
      userId,
      baselineText: "skin firmness baseline",
      baselineRecordId: "rec-1",
      freq: "weekly",
    });

    expect(row.lifecycle).toBe("OBSERVING");
    expect(row.nextCheckInAt).not.toBeNull();
    // weekly = 7 days ≈ 604800000ms
    const delta = row.nextCheckInAt!.getTime() - Date.now();
    expect(delta).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(delta).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    expect(row.observeBaseline).toMatchObject({
      text: "skin firmness baseline",
      baselineRecordId: "rec-1",
      freq: "weekly",
    });

    // TimelineEvent 写入
    const tl = await prisma.timelineEvent.findFirst({
      where: { decisionId, userId },
    });
    expect(tl).toBeTruthy();
    expect(tl?.title).toBe("Started observing");
  });

  it("startObserving: CLOSED throws（不可观察）", async () => {
    const userId = await seedUser("start-closed@example.com");
    const d = await prisma.decision.create({
      data: {
        userId,
        question: "closed",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
      },
    });
    await expect(
      startObserving({
        decisionId: d.id,
        userId,
        baselineText: "x",
        freq: "weekly",
      }),
    ).rejects.toThrow(/cannot start observing/);
  });

  it("startObserving: 越权（userId 不匹配）throws", async () => {
    const userId = await seedUser("start-owner@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await expect(
      startObserving({
        decisionId,
        userId: "intruder",
        baselineText: "x",
        freq: "weekly",
      }),
    ).rejects.toThrow(/forbidden/);
  });

  it("stopObserving: OBSERVING with observations → LEARNING + 清 nextCheckInAt", async () => {
    const userId = await seedUser("stop-with-obs@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await startObserving({
      decisionId,
      userId,
      baselineText: "baseline",
      freq: "weekly",
    });
    // 加一条 observation
    await append({
      decisionId,
      userId,
      text: "feeling better",
      lifecycleSnapshot: "OBSERVING",
      occurredAt: new Date("2026-09-01T00:00:00Z"),
      kind: "observation",
    });

    const result = await stopObserving({ decisionId, userId });
    expect(result.lifecycle).toBe("LEARNING");
    expect(result.hasObservations).toBe(true);

    const row = await prisma.decision.findUnique({
      where: { id: decisionId },
      select: { nextCheckInAt: true },
    });
    expect(row?.nextCheckInAt).toBeNull();
  });

  it("stopObserving: OBSERVING without observations → COMPLETED", async () => {
    const userId = await seedUser("stop-no-obs@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await startObserving({
      decisionId,
      userId,
      baselineText: "baseline",
      freq: "weekly",
    });
    // 不加任何 observation
    const result = await stopObserving({ decisionId, userId });
    expect(result.lifecycle).toBe("COMPLETED");
    expect(result.hasObservations).toBe(false);
  });

  it("stopObserving: DECIDED throws（必须先 Start）", async () => {
    const userId = await seedUser("stop-not-obs@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await expect(stopObserving({ decisionId, userId })).rejects.toThrow(
      /cannot stop observing/,
    );
  });

  it("markCompleted: DECIDED → COMPLETED 直接路径 + 清 observeBaseline", async () => {
    const userId = await seedUser("mark-completed@example.com");
    const decisionId = await seedDecidedDecision(userId);

    const row = await markCompleted({ decisionId, userId });
    expect(row.lifecycle).toBe("COMPLETED");
    expect(row.nextCheckInAt).toBeNull();
    expect(row.observeBaseline).toBeNull();

    const tl = await prisma.timelineEvent.findFirst({
      where: { decisionId, userId },
    });
    expect(tl?.title).toBe("Marked as completed");
  });

  it("markCompleted: ACTIVE throws（不可直跳 COMPLETED）", async () => {
    const userId = await seedUser("mark-active@example.com");
    const d = await create(userId, { question: "still active" }); // lifecycle=ACTIVE
    await expect(markCompleted({ decisionId: d.id, userId })).rejects.toThrow(
      /cannot mark as completed/,
    );
  });

  it("completeAfterLearning: LEARNING → COMPLETED", async () => {
    const userId = await seedUser("complete-after-learn@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await startObserving({
      decisionId,
      userId,
      baselineText: "baseline",
      freq: "weekly",
    });
    await append({
      decisionId,
      userId,
      text: "observation 1",
      lifecycleSnapshot: "OBSERVING",
      occurredAt: new Date(),
      kind: "observation",
    });
    await stopObserving({ decisionId, userId }); // → LEARNING

    const row = await completeAfterLearning({ decisionId, userId });
    expect(row.lifecycle).toBe("COMPLETED");
    expect(row.observeBaseline).toBeNull();
  });

  it("completeAfterLearning: OBSERVING throws（必须先 Stop）", async () => {
    const userId = await seedUser("complete-not-learn@example.com");
    const decisionId = await seedDecidedDecision(userId);
    await startObserving({
      decisionId,
      userId,
      baselineText: "baseline",
      freq: "weekly",
    });
    await expect(completeAfterLearning({ decisionId, userId })).rejects.toThrow(
      /cannot complete after learning/,
    );
  });

  it("listDueForCheckIn: 返回到期 OBSERVING decisions（按 nextCheckInAt ASC）", async () => {
    const userId = await seedUser("due@example.com");
    // 创建两个 DECIDED → Start Observing（weekly，立即到期，因 nextCheckInAt 设为 now+7d 但下面用 future now）
    const d1 = await prisma.decision.create({
      data: {
        userId,
        question: "due1",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
      },
    });
    const d2 = await prisma.decision.create({
      data: {
        userId,
        question: "due2",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
      },
    });
    // d1 早到期（昨天），d2 晚到期（今天）
    await prisma.decision.update({
      where: { id: d1.id },
      data: {
        lifecycle: "OBSERVING",
        nextCheckInAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });
    await prisma.decision.update({
      where: { id: d2.id },
      data: {
        lifecycle: "OBSERVING",
        nextCheckInAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    });

    const due = await listDueForCheckIn(userId);
    expect(due).toHaveLength(2);
    // ASC 排序：早到期的在前
    expect(due[0].id).toBe(d1.id);
    expect(due[1].id).toBe(d2.id);
  });

  it("listDueForCheckIn: 不返回 COMPLETED/CLOSED/DECIDED", async () => {
    const userId = await seedUser("due-filter@example.com");
    const completed = await prisma.decision.create({
      data: {
        userId,
        question: "completed",
        lifecycle: "COMPLETED",
        nextCheckInAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });
    const decided = await prisma.decision.create({
      data: {
        userId,
        question: "decided",
        lifecycle: "DECIDED",
        nextCheckInAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });
    const due = await listDueForCheckIn(userId);
    expect(due.find((d) => d.id === completed.id)).toBeUndefined();
    expect(due.find((d) => d.id === decided.id)).toBeUndefined();
  });
});
