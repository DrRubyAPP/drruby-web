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
  title: "Vitamin C AM",
  hypothesis: "Brightens over 8 weeks",
  status: "running",
  window: "8 weeks",
};

describe("POST /api/experiments", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest(valid));
    expect(res.status).toBe(401);
  });

  it("非法 status 枚举 → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("exp-bad@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ ...valid, status: "bogus" }));
    expect(res.status).toBe(400);
  });

  it("创建后可被 GET 读到", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("exp-ok@example.com");
    asUser(user.id);
    const created = await POST(jsonRequest(valid));
    expect(created.status).toBe(201);
    const list = await GET();
    const rows: Array<{ title: string; status: string }> = await list.json();
    expect(rows[0]).toMatchObject({ title: valid.title, status: "running" });
  });
});
