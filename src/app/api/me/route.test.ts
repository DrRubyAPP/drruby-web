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

  it("PATCH 未登录 → 401", async () => {
    const { PATCH } = await import("./route");
    asAnonymous();
    const res = await PATCH(jsonRequest({ name: "x" }, { method: "PATCH" }));
    expect(res.status).toBe(401);
  });

  it("PATCH 更新 name", async () => {
    const { PATCH } = await import("./route");
    const user = await makeUser("me-patch@example.com");
    asUser(user.id);
    const res = await PATCH(jsonRequest({ name: "Ruby" }, { method: "PATCH" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Ruby");
  });

  it("DELETE 软删脱敏不可逆：行仍在、status=deleted、email 脱敏、session 失效", async () => {
    const { DELETE } = await import("./route");
    const repo = await import("@/lib/db/repositories/userAccount.repo");
    const { prisma } = await import("@/lib/db/prisma");
    const user = await makeUser("me-delete@example.com");
    // 造一条 session，删号后应被清除
    await prisma.session.create({
      data: {
        id: "sess-del-1",
        token: "tok-del-1",
        userId: user.id,
        expiresAt: new Date("2999-01-01T00:00:00.000Z"),
      },
    });

    asUser(user.id);
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);

    // 行仍在（未物理删），但已脱敏、状态 deleted
    const row = await repo.findById(user.id);
    expect(row).not.toBeNull();
    expect(row?.status).toBe("deleted");
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.email).not.toBe("me-delete@example.com");
    expect(row?.email).toContain("deleted+");
    expect(row?.name).toBeNull();

    // session 已失效
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });
    expect(sessions).toHaveLength(0);
  });
});
