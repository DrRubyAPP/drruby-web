import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
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

describe("POST /api/decisions/[id]/observe/start", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("DECIDED → OBSERVING + 设 nextCheckInAt + observeBaseline 落库", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("start-ok@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ baselineText: "LDL=130", freq: "weekly" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("OBSERVING");
    expect(body.nextCheckInAt).not.toBeNull();
    expect(body.observeBaseline).toMatchObject({
      text: "LDL=130",
      freq: "weekly",
    });

    // nextCheckInAt ≈ now + 7 天
    const updated = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    const deltaDays =
      (updated!.nextCheckInAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(deltaDays).toBeGreaterThan(6.9);
    expect(deltaDays).toBeLessThan(7.1);

    // TimelineEvent 写入
    const events = await prisma.timelineEvent.findMany({
      where: { decisionId: decision.id },
    });
    expect(events.some((e) => e.title === "Started observing")).toBe(true);
  });

  it("baselineRecordId 可选传入 + 落库到 observeBaseline", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("start-rec@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({
        baselineText: "with record",
        baselineRecordId: "rec-abc",
        freq: "daily",
      }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.observeBaseline).toMatchObject({
      text: "with record",
      baselineRecordId: "rec-abc",
      freq: "daily",
    });
  });

  it("非 DECIDED（ACTIVE）→ 422", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("start-active@example.com");
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
      jsonRequest({ baselineText: "x", freq: "weekly" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("缺 freq → 400（ZodError）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("start-nofreq@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ baselineText: "x" }),
      params(decision.id),
    );
    expect(res.status).toBe(400);
  });

  it("越权 → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("start-real@example.com");
    const intruder = await makeUser("start-intruder@example.com");
    const decision = await createDecidedDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ baselineText: "x", freq: "weekly" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("start-anon@example.com");
    const decision = await createDecidedDecision(owner.id);

    asAnonymous();
    const res = await POST(
      jsonRequest({ baselineText: "x", freq: "weekly" }),
      params(decision.id),
    );
    expect(res.status).toBe(401);
  });
});
