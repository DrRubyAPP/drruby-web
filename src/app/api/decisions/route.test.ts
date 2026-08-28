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

describe("POST /api/decisions", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest({ question: "q" }));
    expect(res.status).toBe(401);
  });

  it("非法 type 枚举 → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-bad@example.com");
    asUser(user.id);
    const res = await POST(
      jsonRequest({ question: "q", goal: "firmness", type: "bogus" }),
    );
    expect(res.status).toBe(400);
  });

  it("缺 goal → 201，缺省 lifecycle=ACTIVE、decisionKind=unconfirmed、type=not_sure、topic/topicSlug=null、saved=false", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-nogoal@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ question: "Should I do Thermage?" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.goal).toBeNull();
    expect(body.lifecycle).toBe("ACTIVE");
    expect(body.decisionKind).toBe("unconfirmed");
    expect(body.outcome).toBeNull();
    expect(body.type).toBe("not_sure");
    expect(body.topic).toBeNull();
    expect(body.topicSlug).toBeNull();
    expect(body.saved).toBe(false);
  });

  it("带 topic/topicSlug/type 三元组（chip）→ 201 并回填", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-topic@example.com");
    asUser(user.id);
    const res = await POST(
      jsonRequest({
        question: "Should I do Thermage?",
        topic: "Thermage",
        topicSlug: "thermage",
        type: "procedure",
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.topic).toBe("Thermage");
    expect(body.topicSlug).toBe("thermage");
    expect(body.type).toBe("procedure");
  });

  it("非法 topicSlug → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-badslug@example.com");
    asUser(user.id);
    const res = await POST(
      jsonRequest({ question: "q", topicSlug: "surgery" }),
    );
    expect(res.status).toBe(400);
  });

  it("Ask 创建即 Actionable：无需 Keep 就出现在列表（§6 saved 纠偏）", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("dec-create@example.com");
    asUser(user.id);

    const created = await POST(jsonRequest({ question: "Restart retinol?" }));
    expect(created.status).toBe(201);
    const createdBody = await created.json();

    // 刚创建（saved=false）→ 已是 Actionable，直接出现在列表
    const before = await GET();
    const rowsBefore: Array<{ id: string; saved: boolean }> =
      await before.json();
    const hit = rowsBefore.find((r) => r.id === createdBody.id);
    expect(hit).toBeDefined();
    expect(hit?.saved).toBe(false); // saved 仍 false，但可见性不受影响（§11）

    // Keep this → saved=true（纯书签），列表仍含该条
    const { POST: POST_ID } = await import("./[id]/route");
    const keep = await POST_ID(
      jsonRequest({ saved: true }, { method: "POST" }),
      params(createdBody.id),
    );
    expect(keep.status).toBe(200);

    const after = await GET();
    const rowsAfter: Array<{ id: string; saved: boolean }> = await after.json();
    const kept = rowsAfter.find((r) => r.id === createdBody.id);
    expect(kept).toBeDefined();
    expect(kept?.saved).toBe(true);
  });
});
