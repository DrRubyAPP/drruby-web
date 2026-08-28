import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
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

  it("owner 推进 lifecycle → DECIDED", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-patch@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "firmness",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ lifecycle: "DECIDED" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lifecycle).toBe("DECIDED");
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
});
