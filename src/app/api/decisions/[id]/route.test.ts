import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/decisions/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("改他人决策 → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-owner@example.com");
    const intruder = await makeUser("dec-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "firmness",
    });

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ lifecycle: "DECIDED" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);

    // 库未被越权修改
    const still = await decisionRepo.findById(decision.id);
    expect(still?.lifecycle).toBe("ACTIVE");
  });

  it("owner 提交合法 outcome → lifecycle 派生 DECIDED + decidedAt 落库", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-patch@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "firmness",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        { decisionKind: "action", outcome: "decided_to_do_it" },
        { method: "POST" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("DECIDED");
    expect(body.outcome).toBe("decided_to_do_it");
    expect(body.decidedAt).not.toBe(null);
  });

  it("非法 kind↔outcome 组合 → 422（B1）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-422@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "firmness",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        { decisionKind: "action", outcome: "keep_exploring" },
        { method: "POST" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(422);
  });

  it("Keep this：saved + yourselfContext 持久化并随 GET 读回（A5 契约）", async () => {
    const { POST, GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-keep@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Should I try HRT?",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        { saved: true, yourselfContext: "42, poor sleep, considering HRT" },
        { method: "POST" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
    expect(body.yourselfContext).toBe("42, poor sleep, considering HRT");

    const detail = await GET(bareRequest("GET"), params(decision.id));
    const detailBody = await detail.json();
    expect(detailBody.saved).toBe(true);
    expect(detailBody.yourselfContext).toBe("42, poor sleep, considering HRT");
    expect(detailBody.type).toBe("not_sure"); // DTO 含 type（req 调整清单第 4 项）
  });

  it("B7: outcome 反悔 DECIDED→still_considering 经 PATCH 直接回退 ACTIVE，不写归档 entry", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const decisionEntryRepo = await import(
      "@/lib/db/repositories/decisionEntry.repo"
    );
    const owner = await makeUser("dec-b7@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "regret it",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      lifecycle: "DECIDED",
    });
    const beforeEntries = await decisionEntryRepo.listByDecision(decision.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ outcome: "still_considering" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe("still_considering");
    expect(body.lifecycle).toBe("ACTIVE");
    expect(body.decidedAt).toBe(null);

    // B7：不写归档 entry（区别于 Closed→Reopen）
    const afterEntries = await decisionEntryRepo.listByDecision(decision.id);
    expect(afterEntries.length).toBe(beforeEntries.length);
    expect(
      afterEntries.some(
        (e: { kind: string | null }) => e.kind === "archived_outcome",
      ),
    ).toBe(false);
  });

  it("F3: decided_on_next_step 无 next_step → 422（req 验收 3，服务端守卫）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-nextstep@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "next step required",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        { decisionKind: "exploration", outcome: "decided_on_next_step" },
        { method: "POST" },
      ), // 不带 nextStep
      params(decision.id),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("UNPROCESSABLE_ENTITY");
  });

  it("F3: decided_on_next_step 带 next_step → 200 DECIDED + decidedAt 落库", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-nextstep-ok@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "next step ok",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        {
          decisionKind: "exploration",
          outcome: "decided_on_next_step",
          nextStep: "Book a consult with Dr. Lee",
        },
        { method: "POST" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe("decided_on_next_step");
    expect(body.nextStep).toBe("Book a consult with Dr. Lee");
    expect(body.lifecycle).toBe("DECIDED");
    expect(body.decidedAt).not.toBe(null);
  });
});

describe("DELETE /api/decisions/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { DELETE } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("del-anon@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
    });

    asAnonymous();
    const res = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(res.status).toBe(401);
  });

  it("本人删除 → 204；行仍在库且 deletedAt 非空（D-8 永久保留）", async () => {
    const { DELETE } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const prisma = (await import("@/lib/db/prisma")).prisma;
    const owner = await makeUser("del-owner@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
    });

    asUser(owner.id);
    const res = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(res.status).toBe(204);

    // 直查（绕过 repo 软删过滤）：行未物理删除
    const raw = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(raw).not.toBe(null);
    expect(raw?.deletedAt).not.toBe(null);
  });

  it("删除后 GET 详情 → 404；POST 更新 → 404", async () => {
    const { DELETE, GET, POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("del-gone@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
    });

    asUser(owner.id);
    await DELETE(bareRequest("DELETE"), params(decision.id));

    const detail = await GET(bareRequest("GET"), params(decision.id));
    expect(detail.status).toBe(404);

    const update = await POST(
      jsonRequest({ saved: true }, { method: "POST" }),
      params(decision.id),
    );
    expect(update.status).toBe(404);
  });

  it("重复删除 → 404（findById 过滤软删）", async () => {
    const { DELETE } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("del-twice@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
    });

    asUser(owner.id);
    const first = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(first.status).toBe(204);
    const second = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(second.status).toBe(404);
  });

  it("他人 Decision → 404，且行未被动（deletedAt 仍为 null）", async () => {
    const { DELETE } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const prisma = (await import("@/lib/db/prisma")).prisma;
    const owner = await makeUser("del-victim@example.com");
    const intruder = await makeUser("del-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
    });

    asUser(intruder.id);
    const res = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(res.status).toBe(404);

    const raw = await prisma.decision.findUnique({
      where: { id: decision.id },
    });
    expect(raw?.deletedAt).toBe(null);
  });

  it("不存在 id → 404", async () => {
    const { DELETE } = await import("./route");
    const owner = await makeUser("del-ghost@example.com");

    asUser(owner.id);
    const res = await DELETE(bareRequest("DELETE"), params("nonexistent-id"));
    expect(res.status).toBe(404);
  });
});
