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

const valid = {
  kind: "lab",
  title: "Full blood panel",
  source: "your doctor",
  recordedAt: "2026-03-01T00:00:00.000Z",
};

describe("health/reports 读写", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest(valid));
    expect(res.status).toBe(401);
  });

  it("非法 kind → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hr-bad@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ ...valid, kind: "bogus" }));
    expect(res.status).toBe(400);
  });

  it("POST 后 GET 可读到，且 ocrStatus=manual", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("hr-ok@example.com");
    asUser(user.id);

    const created = await POST(jsonRequest(valid));
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.ocrStatus).toBe("manual");

    const list = await GET();
    const rows: Array<{ id: string; title: string }> = await list.json();
    expect(rows.some((r) => r.id === body.id)).toBe(true);
    expect(rows[0].title).toBe(valid.title);
  });

  it("原始记录不被覆盖（无 PATCH 端点，多次 POST 累加）", async () => {
    const routeMod = await import("./route");
    const user = await makeUser("hr-appendonly@example.com");
    asUser(user.id);

    await routeMod.POST(jsonRequest(valid));
    await routeMod.POST(jsonRequest({ ...valid, title: "Second" }));
    const rows = await (await routeMod.GET()).json();
    expect(rows).toHaveLength(2);
    // route 面收敛：不导出 PATCH/PUT/DELETE
    expect(routeMod).not.toHaveProperty("PATCH");
    expect(routeMod).not.toHaveProperty("PUT");
    expect(routeMod).not.toHaveProperty("DELETE");
  });
});
