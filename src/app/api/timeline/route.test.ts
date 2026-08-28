import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  jsonRequest,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/timeline", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest({ kind: "note", title: "t" }));
    expect(res.status).toBe(401);
  });

  it("非法 kind 枚举 → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("tl-bad@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ kind: "bogus", title: "t" }));
    expect(res.status).toBe(400);
  });

  it("关联他人决策 → 404", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("tl-owner@example.com");
    const other = await makeUser("tl-other@example.com");
    const decision = await decisionRepo.create(other.id, {
      question: "q",
      goal: "sleep-quality",
    });
    asUser(owner.id);
    const res = await POST(
      jsonRequest({ kind: "note", title: "t", decisionId: decision.id }),
    );
    expect(res.status).toBe(404);
  });

  it("创建后可被 GET 读到", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("tl-ok@example.com");
    asUser(user.id);
    const created = await POST(
      jsonRequest({ kind: "treatment", title: "Started tretinoin" }),
    );
    expect(created.status).toBe(201);
    const list = await GET();
    const rows: Array<{ title: string; kind: string }> = await list.json();
    expect(rows[0]).toMatchObject({
      title: "Started tretinoin",
      kind: "treatment",
    });
  });
});
