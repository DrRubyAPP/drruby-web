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

describe("POST /api/decisions/[id]/reopen", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  async function createClosedDecision(userId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.decision.create({
      data: {
        userId,
        question: "Reopen me",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
        decidedAt: new Date(),
      },
    });
  }

  it("CLOSED → ACTIVE 原子事务：归档 entry + 清空 outcome/nextStep/decidedAt + 不写 freshnessCheckedAt", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("reopen-owner@example.com");
    const decision = await createClosedDecision(owner.id);

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("ACTIVE");
    expect(body.outcome).toBe(null);
    expect(body.nextStep).toBe(null);
    expect(body.decidedAt).toBe(null);
    expect(body.freshnessCheckedAt).toBe(null);

    // 归档 entry 落库
    const archived = await prisma.decisionEntry.findFirst({
      where: { decisionId: decision.id, kind: "archived_outcome" },
    });
    expect(archived).not.toBe(null);
    expect(archived?.synthesis).toMatchObject({
      outcome: "decided_not_to",
      nextStep: null,
    });
  });

  it("非 CLOSED 决策 → 422", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("reopen-active@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("越权 → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("reopen-real@example.com");
    const intruder = await makeUser("reopen-intruder@example.com");
    const decision = await createClosedDecision(owner.id);

    asUser(intruder.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/decisions/[id]/check-freshness", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("写 freshnessCheckedAt=now + materialChange=false（V1 占位）", async () => {
    const { POST } = await import("../check-freshness/route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-owner@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.freshnessCheckedAt).not.toBe(null);
    expect(body.materialChange).toBe(false);

    // 库内 freshnessCheckedAt 已写入
    const row = await decisionRepo.findById(decision.id);
    expect(row?.freshnessCheckedAt).not.toBe(null);
  });
});

describe("freshness gate (D4) on POST /api/decisions/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("Reopen 后未 Check now → 提交 outcome 422 FRESHNESS_GATE_REQUIRED", async () => {
    const { POST: reopenPost } = await import("./route");
    const { POST } = await import("../route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("gate-owner@example.com");

    // 直接造 CLOSED 决策（含 outcome=decided_not_to + decidedAt）
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "gate",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
        decidedAt: new Date(),
      },
    });

    // Reopen：归档 entry 落库 + 清空 outcome
    asUser(owner.id);
    await reopenPost(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );

    // 未 Check now 直接提交新 outcome → gate 拒绝
    const res = await POST(
      jsonRequest({ outcome: "decided_to_do_it" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("FRESHNESS_GATE_REQUIRED");
  });

  it("Check now 后提交 outcome 通过 gate", async () => {
    const { POST: reopenPost } = await import("./route");
    const { POST: checkFreshness } = await import("../check-freshness/route");
    const { POST } = await import("../route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("gate-pass@example.com");

    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "gate-pass",
        lifecycle: "CLOSED",
        decisionKind: "action",
        outcome: "decided_not_to",
        decidedAt: new Date(),
      },
    });

    asUser(owner.id);
    await reopenPost(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    await checkFreshness(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );

    const res = await POST(
      jsonRequest({ outcome: "decided_to_do_it" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("DECIDED");
    expect(body.outcome).toBe("decided_to_do_it");
  });
});

describe("B6 reclassify 自动清空", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("action→exploration 且旧 outcome 非法 → outcome 自动清空 + lifecycle 回退 ACTIVE", async () => {
    const { POST } = await import("../route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("reclassify@example.com");

    // 已是 DECIDED + action + decided_to_do_it
    const decision = await prisma.decision.create({
      data: {
        userId: owner.id,
        question: "reclassify",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ decisionKind: "exploration" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.decisionKind).toBe("exploration");
    expect(body.outcome).toBe(null);
    expect(body.nextStep).toBe(null);
    expect(body.lifecycle).toBe("ACTIVE");
    expect(body.decidedAt).toBe(null);
  });
});
