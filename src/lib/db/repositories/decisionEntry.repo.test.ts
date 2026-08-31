import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decisionEntryRepo } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import {
  append,
  createLearning,
  createObservation,
  findLastArchivedEntry,
  listByDecision,
  listByDecisionAndKind,
  updateObservation,
} from "./decisionEntry.repo";
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
    goal: "even-tone",
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
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await append({
      decisionId,
      userId,
      text: "Changed my mind",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-08T00:00:00Z"),
    });
    const rows = await listByDecision(decisionId);
    expect(rows).toHaveLength(2);
    expect(rows[0].text).toBe("Initial thought"); // 正序，原始记录保留
    expect(rows[1].text).toBe("Changed my mind");
  });

  it("拒绝非法 lifecycleSnapshot", async () => {
    const { userId, decisionId } = await seed();
    await expect(
      append({
        decisionId,
        userId,
        text: "x",
        // @ts-expect-error 测试无效值
        lifecycleSnapshot: "archived",
        occurredAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});

describe("task-41 entry kind/synthesis", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("append with kind + synthesis 持久化两字段", async () => {
    const u = await createUser({
      email: "entry-kind@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    const entry = await append({
      decisionId: d.id,
      userId: u.id,
      text: "Archived: decided_to_do_it",
      lifecycleSnapshot: "CLOSED",
      occurredAt: new Date(),
      kind: "archived_outcome",
      synthesis: {
        outcome: "decided_to_do_it",
        nextStep: null,
        brief: { yourHistory: [] },
      },
    });
    expect(entry.kind).toBe("archived_outcome");
    expect(entry.synthesis).toMatchObject({ outcome: "decided_to_do_it" });

    // 从 DB 读回验证持久化（非内存假象）
    const rows = await listByDecision(d.id);
    const persisted = rows.find((r) => r.id === entry.id);
    expect(persisted?.kind).toBe("archived_outcome");
    expect(persisted?.synthesis).toMatchObject({ outcome: "decided_to_do_it" });
  });

  it("findLastArchivedEntry 返回最近一条 archived_outcome（按 occurredAt desc）", async () => {
    const u = await createUser({
      email: "entry-last@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    const t1 = new Date("2026-06-01T00:00:00Z");
    const t2 = new Date("2026-06-10T00:00:00Z");
    const t3 = new Date("2026-06-20T00:00:00Z");
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "first archive",
      lifecycleSnapshot: "CLOSED",
      occurredAt: t1,
      kind: "archived_outcome",
      synthesis: { outcome: "decided_not_to" },
    });
    // 中间插一条 observation（不应被 findLastArchivedEntry 选中）
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "an observation",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: t2,
      kind: "observation",
    });
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "second archive",
      lifecycleSnapshot: "CLOSED",
      occurredAt: t3,
      kind: "archived_outcome",
      synthesis: { outcome: "decided_to_do_it" },
    });

    const last = await findLastArchivedEntry(d.id);
    expect(last).not.toBeNull();
    expect(last?.occurredAt).toEqual(t3);
    expect(last?.synthesis).toMatchObject({ outcome: "decided_to_do_it" });
  });

  it("findLastArchivedEntry 无 archived entry 时返回 null", async () => {
    const u = await createUser({
      email: "entry-none@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "just an observation",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date(),
    });
    const last = await findLastArchivedEntry(d.id);
    expect(last).toBeNull();
  });

  it("append 拒绝非法 kind", async () => {
    const u = await createUser({
      email: "entry-bad-kind@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    await expect(
      append({
        decisionId: d.id,
        userId: u.id,
        text: "x",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: new Date(),
        // @ts-expect-error 测试无效值
        kind: "bogus_kind",
      }),
    ).rejects.toThrow();
  });

  it("append-only 契约保持：未导出 update/remove", () => {
    const repo = decisionEntryRepo as unknown as Record<string, unknown>;
    expect(repo.update).toBeUndefined();
    expect(repo.remove).toBeUndefined();
  });
});

describe("task-44 createObservation/updateObservation/createLearning/listByDecisionAndKind", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  async function seedObservingDecision(
    email: string,
    options: { withFreq?: boolean } = {},
  ): Promise<{ userId: string; decisionId: string }> {
    const u = await createUser({
      email,
      authProvider: "email",
      role: "user",
    });
    // 直接造 OBSERVING decision（不走 startObserving，简化测试）
    const d = await prisma.decision.create({
      data: {
        userId: u.id,
        question: "Observe me",
        lifecycle: "OBSERVING",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        ...(options.withFreq === false
          ? {}
          : {
              observeBaseline: {
                text: "baseline",
                freq: "weekly",
              },
              nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }),
      },
    });
    return { userId: u.id, decisionId: d.id };
  }

  it("createObservation 写 entry + 顺延 nextCheckInAt（按 freq=weekly 推 7 天）", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "create-obs@example.com",
    );
    const callTime = Date.now();

    const entry = await createObservation({
      decisionId,
      userId,
      text: "feeling better today",
      direction: "better",
      synthesis: {
        photos: [{ recordId: "photo-1", summary: "front view" }],
        recordRefs: [{ recordId: "lab-1" }],
      },
    });

    expect(entry.kind).toBe("observation");
    expect(entry.direction).toBe("better");
    expect(entry.lifecycleSnapshot).toBe("OBSERVING");
    expect(entry.synthesis).toMatchObject({
      photos: [{ recordId: "photo-1" }],
      recordRefs: [{ recordId: "lab-1" }],
    });

    const after = await prisma.decision.findUnique({
      where: { id: decisionId },
      select: { nextCheckInAt: true },
    });
    // 新的 nextCheckInAt ≈ createObservation 调用时刻 + 7 天
    const delta = after!.nextCheckInAt!.getTime() - callTime;
    expect(delta).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000);
    expect(delta).toBeLessThanOrEqual(8 * 24 * 60 * 60 * 1000);
  });

  it("createObservation: direction 非必填（允许无方向）", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "create-obs-no-dir@example.com",
    );
    const entry = await createObservation({
      decisionId,
      userId,
      text: "general note",
      // direction 不传
    });
    expect(entry.direction).toBeNull();
  });

  it("createObservation: 无 freq 时 nextCheckInAt 不写但仍刷 lastUserActivityAt", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "create-obs-no-freq@example.com",
      { withFreq: false },
    );
    const before = await prisma.decision.findUnique({
      where: { id: decisionId },
      select: { lastUserActivityAt: true, nextCheckInAt: true },
    });
    expect(before?.nextCheckInAt).toBeNull();

    await createObservation({
      decisionId,
      userId,
      text: "no freq observation",
    });
    const after = await prisma.decision.findUnique({
      where: { id: decisionId },
      select: { lastUserActivityAt: true },
    });
    expect(after!.lastUserActivityAt.getTime()).toBeGreaterThanOrEqual(
      before!.lastUserActivityAt.getTime(),
    );
  });

  it("updateObservation: 仅改 direction/text/synthesis，保留 occurredAt/createdAt（append-only）", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "update-obs@example.com",
    );
    const original = await createObservation({
      decisionId,
      userId,
      text: "original text",
      direction: "better",
    });
    const occurredAt = original.occurredAt;
    const createdAt = original.createdAt;

    // 等一小段时间确保 now 不同
    const updated = await updateObservation({
      entryId: original.id,
      userId,
      text: "updated text",
      direction: "worse",
      synthesis: {
        photos: [{ recordId: "p2" }],
        recordRefs: [],
      },
    });

    expect(updated.text).toBe("updated text");
    expect(updated.direction).toBe("worse");
    expect(updated.synthesis).toMatchObject({
      photos: [{ recordId: "p2" }],
    });
    // occurredAt/createdAt 不变（append-only 原则）
    expect(updated.occurredAt.toISOString()).toBe(occurredAt.toISOString());
    expect(updated.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("updateObservation: 越权 throws", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "update-obs-owner@example.com",
    );
    const entry = await createObservation({
      decisionId,
      userId,
      text: "x",
    });
    await expect(
      updateObservation({
        entryId: entry.id,
        userId: "intruder",
        text: "hack",
      }),
    ).rejects.toThrow(/forbidden/);
  });

  it("updateObservation: entry 不存在 throws", async () => {
    const { userId } = await seedObservingDecision(
      "update-obs-missing@example.com",
    );
    await expect(
      updateObservation({
        entryId: "nonexistent",
        userId,
        text: "x",
      }),
    ).rejects.toThrow(/not found/);
  });

  it("createLearning 写 kind=learning entry + synthesis.supportingObservationIds", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "create-learn@example.com",
    );
    // 先造 3 个 observations
    const o1 = await createObservation({
      decisionId,
      userId,
      text: "obs1",
      direction: "better",
    });
    const o2 = await createObservation({
      decisionId,
      userId,
      text: "obs2",
      direction: "better",
    });
    const o3 = await createObservation({
      decisionId,
      userId,
      text: "obs3",
      direction: "worse",
    });

    const learning = await createLearning({
      decisionId,
      userId,
      text: "You recorded 'better' changes more than once (2 times). This may be worth continuing to observe.",
      supportingObservationIds: [o1.id, o2.id, o3.id],
    });

    expect(learning.kind).toBe("learning");
    expect(learning.lifecycleSnapshot).toBe("LEARNING");
    expect(learning.synthesis).toMatchObject({
      text: expect.stringContaining("more than once"),
      supportingObservationIds: [o1.id, o2.id, o3.id],
      generatedAt: expect.any(String),
    });
  });

  it("createLearning 多次写入都新增 entry（append-only，不覆盖旧 learning）", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "create-learn-twice@example.com",
    );
    const l1 = await createLearning({
      decisionId,
      userId,
      text: "first learning",
      supportingObservationIds: [],
    });
    const l2 = await createLearning({
      decisionId,
      userId,
      text: "second learning (regenerated)",
      supportingObservationIds: [],
    });
    expect(l1.id).not.toBe(l2.id);

    const learnings = await listByDecisionAndKind(decisionId, "learning");
    expect(learnings).toHaveLength(2);
    // 倒序：最新在前
    expect(learnings[0].id).toBe(l2.id);
    expect(learnings[1].id).toBe(l1.id);
  });

  it("listByDecisionAndKind: observation 升序、learning 降序", async () => {
    const { userId, decisionId } = await seedObservingDecision(
      "list-kind@example.com",
    );
    const o1 = await createObservation({
      decisionId,
      userId,
      text: "o1",
      occurredAt: new Date("2026-09-01T00:00:00Z"),
    });
    const o2 = await createObservation({
      decisionId,
      userId,
      text: "o2",
      occurredAt: new Date("2026-09-05T00:00:00Z"),
    });
    const l1 = await createLearning({
      decisionId,
      userId,
      text: "l1",
      supportingObservationIds: [],
    });

    const observations = await listByDecisionAndKind(decisionId, "observation");
    expect(observations.map((o) => o.id)).toEqual([o1.id, o2.id]); // asc

    const learnings = await listByDecisionAndKind(decisionId, "learning");
    expect(learnings.map((l) => l.id)).toEqual([l1.id]); // desc，单元素
  });
});
