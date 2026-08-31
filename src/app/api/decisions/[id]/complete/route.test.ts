import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

async function createDecidedDecision(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.decision.create({
    data: {
      userId,
      question: "decided",
      lifecycle: "DECIDED",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
    },
  });
}

describe("POST /api/decisions/[id]/complete", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("DECIDED → COMPLETED + 清 nextCheckInAt/observeBaseline", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("complete-ok@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("COMPLETED");

    const updated = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(updated?.nextCheckInAt).toBeNull();
    expect(updated?.observeBaseline).toBeNull();

    // TimelineEvent 写入
    const events = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id },
    });
    expect(events.some((e) => e.title === "Marked as completed")).toBe(true);
  });

  it("非 DECIDED（ACTIVE）→ 422", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("complete-active@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "active",
        lifecycle: "ACTIVE",
        decisionKind: "unconfirmed",
      },
    });

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("OBSERVING → 422（必须先 Stop Observing）", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("complete-observing@example.com");
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
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("越权 → 404", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("complete-real@example.com");
    const intruder = await makeUser("complete-intruder@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});
