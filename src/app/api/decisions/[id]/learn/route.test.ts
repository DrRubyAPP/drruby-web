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

async function createLearningDecision(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.decision.create({
    data: {
      userId,
      question: "learning",
      lifecycle: "LEARNING",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
      observeBaseline: { text: "baseline", freq: "weekly" },
    },
  });
}

async function addObservation(
  decisionId: string,
  userId: string,
  direction: "better" | "same" | "worse" | "not_sure" | null = "better",
): Promise<string> {
  const { prisma } = await import("@/lib/db/prisma");
  const entry = await prisma.decisionEntry.create({
    data: {
      decisionId,
      userId,
      text: `obs-${direction ?? "none"}`,
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      direction,
      occurredAt: new Date(),
      createdAt: new Date(),
    },
  });
  return entry.id;
}

async function createCompletedDecision(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.decision.create({
    data: {
      userId,
      question: "completed",
      lifecycle: "COMPLETED",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
    },
  });
}

async function addLearningEntry(
  decisionId: string,
  userId: string,
  text: string,
  supportingObservationIds: string[],
) {
  const { prisma } = await import("@/lib/db/prisma");
  const occurredAt = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.decisionEntry.create({
    data: {
      decisionId,
      userId,
      text,
      lifecycleSnapshot: "LEARNING",
      kind: "learning",
      synthesis: {
        text,
        supportingObservationIds,
        generatedAt: occurredAt.toISOString(),
      },
      occurredAt,
      createdAt: occurredAt,
    },
  });
}

describe("POST /api/decisions/[id]/learn", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("LEARNING + observations → 写 learning entry + COMPLETED", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("learn-ok@example.com");
    const decision = await createLearningDecision(owner.id);
    const obsId1 = await addObservation(decision.id, owner.id, "better");
    const obsId2 = await addObservation(decision.id, owner.id, "worse");

    asUser(owner.id);
    const res = await POST(
      jsonRequest({
        text: "summary text",
        supportingObservationIds: [obsId1, obsId2],
      }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.learning.kind).toBe("learning");
    expect(body.learning.synthesis).toMatchObject({
      text: "summary text",
      supportingObservationIds: [obsId1, obsId2],
    });
    expect(body.decision.lifecycle).toBe("COMPLETED");

    // observeBaseline 在 completeAfterLearning 时清空
    const updated = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(updated?.observeBaseline).toBeNull();

    // TimelineEvent 写入
    const events = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id },
    });
    expect(events.some((e) => e.title === "Completed")).toBe(true);
  });

  it("非 LEARNING/COMPLETED（OBSERVING）→ 422", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("learn-observing@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "observing",
        lifecycle: "OBSERVING",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
        observeBaseline: { text: "x", freq: "weekly" },
        nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "x", supportingObservationIds: [] }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("UNPROCESSABLE_ENTITY");
    expect(body.error.message).toContain("LEARNING or COMPLETED");
  });

  it("task-51 COMPLETED + 已有 learning → POST 200 写新 entry（append-only），lifecycle 保持 COMPLETED，无重复 Completed 事件", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("learn-regen@example.com");
    const decision = await createCompletedDecision(owner.id);
    const obsId = await addObservation(decision.id, owner.id, "better");
    const oldEntry = await addLearningEntry(
      decision.id,
      owner.id,
      "old summary",
      [obsId],
    );

    asUser(owner.id);
    const res = await POST(
      jsonRequest({
        text: "new summary",
        supportingObservationIds: [obsId],
      }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.learning.kind).toBe("learning");
    expect(body.learning.synthesis).toMatchObject({
      text: "new summary",
      supportingObservationIds: [obsId],
    });
    expect(body.decision.lifecycle).toBe("COMPLETED");

    // append-only：写新 entry（count=2），历史 entry 内容未变
    const entries = await prisma.decisionEntry.findMany({
      where: { decisionId: decision.id, kind: "learning" },
      orderBy: { occurredAt: "asc" },
    });
    expect(entries).toHaveLength(2);
    const persistedOld = entries.find((e) => e.id === oldEntry.id);
    expect(persistedOld?.text).toBe("old summary");
    expect(persistedOld?.occurredAt?.toISOString()).toBe(
      oldEntry.occurredAt.toISOString(),
    );
    expect(persistedOld?.synthesis).toMatchObject({
      text: "old summary",
      supportingObservationIds: [obsId],
    });

    // P-2：COMPLETED 重生成不写新 TimelineEvent
    const events = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id },
    });
    expect(events.filter((e) => e.title === "Completed")).toHaveLength(0);
  });

  it("task-51 COMPLETED（从未 learning）→ POST 200 写 entry（边界）", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("learn-regen-fresh@example.com");
    const decision = await createCompletedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "late learning", supportingObservationIds: [] }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.learning.synthesis).toMatchObject({
      text: "late learning",
    });
    expect(body.decision.lifecycle).toBe("COMPLETED");

    const count = await prisma.decisionEntry.count({
      where: { decisionId: decision.id, kind: "learning" },
    });
    expect(count).toBe(1);
  });

  it("supportingObservationIds 缺省 → 空数组", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("learn-default@example.com");
    const decision = await createLearningDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "no ids" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.learning.synthesis).toMatchObject({
      text: "no ids",
      supportingObservationIds: [],
    });
  });

  it("越权 → 404", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("learn-real@example.com");
    const intruder = await makeUser("learn-intruder@example.com");
    const decision = await createLearningDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ text: "x", supportingObservationIds: [] }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/decisions/[id]/learn", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("返回模板预填（含 supportingObservationIds 默认全选）", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("learn-tpl@example.com");
    const decision = await createLearningDecision(owner.id);
    const obsId1 = await addObservation(decision.id, owner.id, "better");
    const obsId2 = await addObservation(decision.id, owner.id, "better");

    asUser(owner.id);
    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.template.supportingObservationIds).toEqual([obsId1, obsId2]);
    expect(body.template.text).toContain("better");
    expect(body.template.text).toContain("more than once");
  });

  it("无 observations → 模板返回 'No observations recorded yet.'", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("learn-empty@example.com");
    const decision = await createLearningDecision(owner.id);

    asUser(owner.id);
    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.template.text).toBe("No observations recorded yet.");
    expect(body.template.supportingObservationIds).toEqual([]);
  });

  it("locale=zh → 中文模板", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("learn-zh@example.com");
    const decision = await createLearningDecision(owner.id);
    await addObservation(decision.id, owner.id, "better");

    asUser(owner.id);
    const res = await GET(
      new Request("http://test/?locale=zh", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.template.text).toContain("观察");
  });

  it("task-51 COMPLETED 态 → 200 返回模板（重生成预填回归）", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("learn-tpl-completed@example.com");
    const decision = await createCompletedDecision(owner.id);
    await addObservation(decision.id, owner.id, "better");
    await addLearningEntry(decision.id, owner.id, "old summary", []);

    asUser(owner.id);
    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.template.supportingObservationIds)).toBe(true);
    expect(body.template.text).toContain("observation");
  });

  it("越权 → 404", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("learn-tpl-real@example.com");
    const intruder = await makeUser("learn-tpl-intruder@example.com");
    const decision = await createLearningDecision(owner.id);

    asUser(intruder.id);
    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});
