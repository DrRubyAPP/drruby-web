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

async function createObservingDecision(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.decision.create({
    data: {
      userId,
      question: "observing",
      lifecycle: "OBSERVING",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
      observeBaseline: { text: "baseline", freq: "weekly" },
      nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

async function addObservation(
  decisionId: string,
  userId: string,
  text = "obs",
): Promise<void> {
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.decisionEntry.create({
    data: {
      decisionId,
      userId,
      text,
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      occurredAt: new Date(),
      createdAt: new Date(),
    },
  });
}

describe("POST /api/decisions/[id]/observe/stop", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("OBSERVING + 有 observations → LEARNING + hasObservations=true", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("stop-with-obs@example.com");
    const decision = await createObservingDecision(owner.id);
    await addObservation(decision.id, owner.id, "first");
    await addObservation(decision.id, owner.id, "second");

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("LEARNING");
    expect(body.hasObservations).toBe(true);

    // nextCheckInAt 清空
    const updated = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(updated?.nextCheckInAt).toBeNull();
    // observeBaseline 保留（D7 不删历史；completeAfterLearning 时才清）
    expect(updated?.observeBaseline).not.toBeNull();

    // TimelineEvent 写入
    const events = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id },
    });
    expect(events.some((e) => e.title === "Stopped observing")).toBe(true);
  });

  it("OBSERVING + 无 observations → COMPLETED + hasObservations=false", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("stop-no-obs@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("COMPLETED");
    expect(body.hasObservations).toBe(false);
  });

  it("非 OBSERVING（DECIDED）→ 422", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("stop-decided@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "decided",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("越权 → 404", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("stop-real@example.com");
    const intruder = await makeUser("stop-intruder@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});
