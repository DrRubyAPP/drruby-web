import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

/**
 * task-44 One Loop API 级集成走查（D13）
 *
 * 覆盖 DECIDED → Start Observing → Observation → 修正 Observation → Stop → Learning → COMPLETED
 * 全链路 + Mark as completed 直接路径 + WMN P1 到期 check-in 可见性。
 *
 * 真实 DB（docker `dodo-db`），每用例 resetDb 隔离。模拟用户在 UI 上的完整操作序列，
 * 但只走 API 层（route handler），不依赖浏览器。
 */
describe("task-44 One Loop · DECIDED → Start → Observation → Stop → Learning → COMPLETED", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("完整生命周期：Start → 2 observations → 修正 → Stop → Learning → COMPLETED", async () => {
    const { prisma } = await import("@/lib/db/prisma");

    // ── 准备：用户 + DECIDED 决策 ──
    const owner = await makeUser("task44-oneloop-1@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Should I take magnesium?",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });
    asUser(owner.id);

    // ── Phase 1 · Start Observing（§27 D5） ──
    const { POST: postStart } = await import("./[id]/observe/start/route");
    const startRes = await postStart(
      jsonRequest({
        baselineText: "Sleep 6h, energy 4/10",
        baselineRecordId: undefined,
        freq: "weekly",
      }),
      params(decision.id),
    );
    expect(startRes.status).toBe(200);
    const started = await startRes.json();
    expect(started.lifecycle).toBe("OBSERVING");
    expect(started.nextCheckInAt).toBeTruthy();
    expect(started.observeBaseline).toMatchObject({
      text: "Sleep 6h, energy 4/10",
      freq: "weekly",
    });
    // nextCheckInAt 在未来 7 天内（weekly）
    const nextCheckIn = new Date(started.nextCheckInAt);
    const daysAhead =
      (nextCheckIn.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysAhead).toBeGreaterThan(6);
    expect(daysAhead).toBeLessThan(8);

    // TimelineEvent 写入（Start Observing）
    const startEvents = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id, title: "Started observing" },
    });
    expect(startEvents.length).toBe(1);

    // ── Phase 2 · Observation 1（带 direction=better） ──
    const { POST: postObs } = await import("./[id]/observations/route");
    const obs1Res = await postObs(
      jsonRequest({
        text: "Slept 7h, energy 5/10",
        direction: "better",
      }),
      params(decision.id),
    );
    expect(obs1Res.status).toBe(201);
    const obs1 = await obs1Res.json();
    expect(obs1.kind).toBe("observation");
    expect(obs1.direction).toBe("better");

    // ── Phase 2b · Observation 2（无 direction，描述性） ──
    const obs2Res = await postObs(
      jsonRequest({
        text: "Noticed vivid dreams",
        // direction 不传（§28 允许无方向描述）
      }),
      params(decision.id),
    );
    expect(obs2Res.status).toBe(201);
    const obs2 = await obs2Res.json();
    expect(obs2.direction).toBeNull();

    // 顺延 nextCheckInAt（提交 observation 后 = now + 7d）
    const afterObs = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(afterObs?.nextCheckInAt).toBeTruthy();
    expect(afterObs?.lastUserActivityAt.getTime()).toBeGreaterThan(
      started.lastUserActivityAt
        ? new Date(started.lastUserActivityAt).getTime()
        : 0,
    );

    // ── Phase 2c · 修正 Observation 1（D8 append-only，occurredAt 不变） ──
    const { PATCH: patchObs } = await import(
      "./[id]/observations/[entryId]/route"
    );
    const obs1Before = await prisma.decisionEntry.findUnique({
      where: { id: obs1.id },
    });
    const patchRes = await patchObs(
      jsonRequest({
        text: "Slept 7.5h, energy 6/10",
        direction: "better",
      }),
      { params: Promise.resolve({ id: decision.id, entryId: obs1.id }) },
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.text).toBe("Slept 7.5h, energy 6/10");
    // occurredAt 不变
    expect(patched.occurredAt).toBe(obs1Before?.occurredAt.toISOString());

    // ── Phase 3 · Stop → LEARNING（有 observations） ──
    const { POST: postStop } = await import("./[id]/observe/stop/route");
    const stopRes = await postStop(jsonRequest({}), params(decision.id));
    expect(stopRes.status).toBe(200);
    const stopped = await stopRes.json();
    expect(stopped.lifecycle).toBe("LEARNING");
    expect(stopped.hasObservations).toBe(true);

    // ── Phase 3b · GET /learn 拿模板预填 ──
    const { GET: getLearn } = await import("./[id]/learn/route");
    const templateRes = await getLearn(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(templateRes.status).toBe(200);
    const template = await templateRes.json();
    expect(template.template.supportingObservationIds).toEqual([
      obs1.id,
      obs2.id,
    ]);
    // 模板文本不含禁用标签（§29）
    expect(template.template.text).not.toMatch(
      /Emerging|Moderate|Strong|confidence\s*%/i,
    );

    // ── Phase 3c · POST /learn → COMPLETED ──
    const { POST: postLearn } = await import("./[id]/learn/route");
    const learnRes = await postLearn(
      jsonRequest({
        text: "Sleep improved slightly; dreams unrelated.",
        supportingObservationIds: [obs1.id, obs2.id],
      }),
      params(decision.id),
    );
    expect(learnRes.status).toBe(200);
    const learned = await learnRes.json();
    expect(learned.decision.lifecycle).toBe("COMPLETED");
    expect(learned.learning.kind).toBe("learning");
    expect(learned.learning.synthesis).toMatchObject({
      text: "Sleep improved slightly; dreams unrelated.",
      supportingObservationIds: [obs1.id, obs2.id],
    });

    // ── Phase 4 · 历史保留（§14 不被无痕改写） ──
    const allEntries = await prisma.decisionEntry.findMany({
      where: { decisionId: decision.id },
      orderBy: { occurredAt: "asc" },
    });
    // 2 observations + 1 learning = 3 entries（observation 不被删除）
    expect(allEntries.length).toBe(3);
    const observations = allEntries.filter((e) => e.kind === "observation");
    expect(observations.length).toBe(2);
    const learnings = allEntries.filter((e) => e.kind === "learning");
    expect(learnings.length).toBe(1);

    // observeBaseline 已清空（completeAfterLearning 时清）
    const completed = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(completed?.observeBaseline).toBeNull();
    expect(completed?.nextCheckInAt).toBeNull();
    expect(completed?.lifecycle).toBe("COMPLETED");

    // TimelineEvent 写入 Completed
    const completeEvents = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id, title: "Completed" },
    });
    expect(completeEvents.length).toBe(1);
  });

  it("Mark as completed 直接路径：DECIDED → COMPLETED（无需观察）", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("task44-oneloop-2@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Skip observing",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });
    asUser(owner.id);

    const { POST: postComplete } = await import("./[id]/complete/route");
    const res = await postComplete(jsonRequest({}), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("COMPLETED");
    // nextCheckInAt + observeBaseline 应为 null
    expect(body.nextCheckInAt).toBeNull();
    expect(body.observeBaseline).toBeNull();
  });

  it("COMPLETED 终态：禁止 Start Observing（D11）", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("task44-oneloop-3@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Already completed",
        lifecycle: "COMPLETED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });
    asUser(owner.id);

    const { POST: postStart } = await import("./[id]/observe/start/route");
    const res = await postStart(
      jsonRequest({
        baselineText: "x",
        freq: "weekly",
      }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("WMN P1：到期 check-in 出现在 cards；COMPLETED/CLOSED 不出现", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("task44-oneloop-4@example.com");

    // ── 到期的 OBSERVING decision（nextCheckInAt 已过去） ──
    const dueDecision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Due check-in",
        lifecycle: "OBSERVING",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
        observeBaseline: { text: "x", freq: "weekly" },
        nextCheckInAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 天前
      },
    });
    // ── COMPLETED decision（不应出现） ──
    await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Completed",
        lifecycle: "COMPLETED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });
    // ── CLOSED decision（不应出现） ──
    await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "Closed",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
        decidedAt: new Date(),
      },
    });
    asUser(owner.id);

    const { GET: getWmn } = await import("./wmn/route");
    const res = await getWmn();
    expect(res.status).toBe(200);
    const body = await res.json();
    // P1 计数 ≥1（到期 decision）
    expect(body.checkInDueCount).toBeGreaterThanOrEqual(1);
    // cards 中包含到期 decision
    expect(
      body.cards.some((c: { id: string }) => c.id === dueDecision.id),
    ).toBe(true);
    // cards 中不含 COMPLETED/CLOSED
    for (const c of body.cards) {
      expect(c.lifecycle).not.toBe("COMPLETED");
      expect(c.lifecycle).not.toBe("CLOSED");
    }
  });

  it("无 observations 直接 Stop → COMPLETED（D7 无 obs 路径）", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("task44-oneloop-5@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "No obs stop",
        lifecycle: "OBSERVING",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
        observeBaseline: { text: "x", freq: "weekly" },
        nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    asUser(owner.id);

    const { POST: postStop } = await import("./[id]/observe/stop/route");
    const res = await postStop(jsonRequest({}), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("COMPLETED");
    expect(body.hasObservations).toBe(false);
  });
});
