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

/** 直接造 OBSERVING + observeBaseline(weekly) 的 decision 供 observation 测试 */
async function createObservingDecision(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.decision.create({
    data: {
      userId,
      question: "observe-test",
      lifecycle: "OBSERVING",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
      observeBaseline: { text: "baseline", freq: "weekly" },
      nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
  });
}

describe("POST /api/decisions/[id]/observations", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("OBSERVING + 提交 observation → 201 + kind=observation + direction 落库 + nextCheckInAt 顺延 7 天", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("obs-create@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "feeling better", direction: "better" }),
      params(decision.id),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.kind).toBe("observation");
    expect(body.direction).toBe("better");
    expect(body.text).toBe("feeling better");

    // nextCheckInAt 顺延 7 天（weekly freq）
    const updated = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(updated?.nextCheckInAt).not.toBeNull();
    const deltaDays =
      (updated!.nextCheckInAt!.getTime() - Date.now()) /
      (24 * 60 * 60 * 1000);
    expect(deltaDays).toBeGreaterThan(6.9);
    expect(deltaDays).toBeLessThan(7.1);
  });

  it("direction 非必填：仅文本 observation → 201 + direction === null", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("obs-nodir@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "noted skin texture change" }),
      params(decision.id),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.direction).toBe(null);
    expect(body.text).toBe("noted skin texture change");
  });

  it("非 OBSERVING（ACTIVE）→ 422", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("obs-active@example.com");
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
      jsonRequest({ text: "x" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("empty text → 400（ZodError）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("obs-empty@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ text: "" }),
      params(decision.id),
    );
    expect(res.status).toBe(400);
  });

  it("越权 → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("obs-real-owner@example.com");
    const intruder = await makeUser("obs-intruder@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ text: "sneaky" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("obs-anon@example.com");
    const decision = await createObservingDecision(owner.id);

    asAnonymous();
    const res = await POST(
      jsonRequest({ text: "x" }),
      params(decision.id),
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/decisions/[id]/observations", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("按 occurredAt 升序列出该 decision 的 observations", async () => {
    const { GET, POST } = await import("./route");
    const owner = await makeUser("obs-list@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(owner.id);
    await POST(
      jsonRequest({ text: "first", occurredAt: "2026-02-01T00:00:00.000Z" }),
      params(decision.id),
    );
    await POST(
      jsonRequest({ text: "second", occurredAt: "2026-01-01T00:00:00.000Z" }),
      params(decision.id),
    );

    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.observations).toHaveLength(2);
    // listByDecisionAndKind kind=observation 用 occurredAt ASC
    expect(body.observations[0].text).toBe("second");
    expect(body.observations[1].text).toBe("first");
  });

  it("越权 → 404", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("obs-list-real@example.com");
    const intruder = await makeUser("obs-list-intruder@example.com");
    const decision = await createObservingDecision(owner.id);

    asUser(intruder.id);
    const res = await GET(
      new Request("http://test", { method: "GET" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});
