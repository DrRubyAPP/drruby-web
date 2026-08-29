import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/decisions/[id]/check-freshness", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("401 anonymous", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(401);

    // 库内未写 freshnessCheckedAt
    const row = await decisionRepo.findById(decision.id);
    expect(row?.freshnessCheckedAt).toBe(null);
  });

  it("404 cross-user（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-real@example.com");
    const intruder = await makeUser("fresh-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("200 写 freshnessCheckedAt=now + materialChange=false（V1 占位）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-ok@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(owner.id);
    const before = Date.now();
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.materialChange).toBe(false);
    expect(body.freshnessCheckedAt).not.toBe(null);
    expect(new Date(body.freshnessCheckedAt).getTime()).toBeGreaterThanOrEqual(
      before,
    );

    // 库内已写入
    const row = await decisionRepo.findById(decision.id);
    expect(row?.freshnessCheckedAt).not.toBe(null);
    expect(row?.freshnessCheckedAt?.getTime()).toBeGreaterThanOrEqual(before);
  });
});
