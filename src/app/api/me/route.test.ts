import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("账号自主权 /api/me", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("POST 未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest({ name: "x" }, { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("POST 更新 name", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("me-patch@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ name: "Ruby" }, { method: "POST" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Ruby");
  });

  it("POST 更新 timezone / image（task-35 扩展）", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("me-tz@example.com");
    asUser(user.id);
    const res = await POST(
      jsonRequest(
        { timezone: "Asia/Shanghai", image: "https://cdn.example.com/a.png" },
        { method: "POST" },
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(user.name ?? "");

    // 落库校验
    const { prisma } = await import("@/lib/db/prisma");
    const row = await prisma.userAccount.findUnique({ where: { id: user.id } });
    expect(row?.timezone).toBe("Asia/Shanghai");
    expect(row?.image).toBe("https://cdn.example.com/a.png");
  });

  it("POST 空 body（无任何字段）→ 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("me-empty@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({}, { method: "POST" }));
    expect(res.status).toBe(400);
  });
});
