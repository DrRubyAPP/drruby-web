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
    const res = await POST(
      jsonRequest({ question: "q", status: "considering" }),
    );
    expect(res.status).toBe(401);
  });

  it("非法 status 枚举 → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-bad@example.com");
    asUser(user.id);
    const res = await POST(
      jsonRequest({ question: "q", goal: "firmness", status: "bogus" }),
    );
    expect(res.status).toBe(400);
  });

  it("缺 goal/status → 201，缺省 status=considering、type=not_sure、saved=false", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("dec-create-nogoal@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ question: "Should I do Thermage?" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.goal).toBeNull();
    expect(body.status).toBe("considering");
    expect(body.type).toBe("not_sure");
    expect(body.saved).toBe(false);
  });

  it("saved 过滤：创建后不可见，Keep 后出现在列表（Not-now 不可检索）", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("dec-create@example.com");
    asUser(user.id);

    const created = await POST(jsonRequest({ question: "Restart retinol?" }));
    expect(created.status).toBe(201);
    const createdBody = await created.json();

    // 刚创建（saved=false）→ 不在列表
    const before = await GET();
    const rowsBefore: Array<{ id: string }> = await before.json();
    expect(rowsBefore.some((r) => r.id === createdBody.id)).toBe(false);

    // Keep this → saved=true → 出现在列表
    const { POST: POST_ID } = await import("./[id]/route");
    const keep = await POST_ID(
      jsonRequest({ saved: true }, { method: "POST" }),
      params(createdBody.id),
    );
    expect(keep.status).toBe(200);

    const after = await GET();
    const rowsAfter: Array<{ id: string; saved: boolean }> = await after.json();
    const hit = rowsAfter.find((r) => r.id === createdBody.id);
    expect(hit).toBeDefined();
    expect(hit?.saved).toBe(true);
  });
});
