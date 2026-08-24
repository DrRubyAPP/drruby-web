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
      status: "considering",
    });

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ status: "decided" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);

    // 库未被越权修改
    const still = await decisionRepo.findById(decision.id);
    expect(still?.status).toBe("considering");
  });

  it("owner 推进到 decided → 落定 decidedAt", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("dec-patch@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "firmness",
      status: "considering",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ status: "decided" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("decided");

    const row = await decisionRepo.findById(decision.id);
    expect(row?.decidedAt).not.toBeNull();
  });
});
