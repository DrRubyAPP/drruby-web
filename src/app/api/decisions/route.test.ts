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
    const res = await POST(jsonRequest({ question: "q", status: "bogus" }));
    expect(res.status).toBe(400);
  });

  it("创建后归属当前用户，且可被 GET 列表读到", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("dec-create@example.com");
    asUser(user.id);

    const created = await POST(
      jsonRequest({ question: "Restart retinol?", status: "considering" }),
    );
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.question).toBe("Restart retinol?");
    expect(body.status).toBe("considering");

    const list = await GET();
    const rows: Array<{ id: string }> = await list.json();
    expect(rows.some((r) => r.id === body.id)).toBe(true);
  });
});
