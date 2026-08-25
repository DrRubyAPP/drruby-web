import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// requireUser 用可变 holder 注入当前用户
let currentUserId = "";
vi.mock("@/lib/auth/session", () => ({
  requireUser: async () => ({ id: currentUserId }),
}));

describe("/api/notification-preferences", () => {
  beforeEach(async () => {
    const { resetDatabase } = await import(
      "@/lib/db/repositories/test-helpers"
    );
    await resetDatabase();
  });
  afterEach(async () => {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$disconnect();
  });

  it("GET 空表 → 全 4 项默认 enabled=true（不落库）", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const { prisma } = await import("@/lib/db/prisma");
    const { GET } = await import("./route");

    const user = await createUser({
      email: "notif-api@example.com",
      authProvider: "email",
      role: "user",
    });
    currentUserId = user.id;

    const res = await GET();
    expect(res.status).toBe(200);
    const body: { key: string; enabled: boolean }[] = await res.json();
    expect(body).toHaveLength(4);
    expect(body.every((b) => b.enabled)).toBe(true);
    // GET 不写库
    expect(await prisma.notificationPreference.count()).toBe(0);
  });

  it("PUT 落库 → GET 合并出实际值；非法 key → 400", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const { GET, PUT } = await import("./route");

    const user = await createUser({
      email: "notif-api-put@example.com",
      authProvider: "email",
      role: "user",
    });
    currentUserId = user.id;

    const put = await PUT(
      new Request("http://test/api/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ key: "weekly_digest", enabled: false }),
      }),
    );
    expect(put.status).toBe(200);
    const putBody = await put.json();
    expect(putBody).toEqual({ key: "weekly_digest", enabled: false });

    const list = await GET();
    const body: { key: string; enabled: boolean }[] = await list.json();
    const digest = body.find((b) => b.key === "weekly_digest");
    expect(digest?.enabled).toBe(false);
    const others = body.filter((b) => b.key !== "weekly_digest");
    expect(others.every((o) => o.enabled)).toBe(true);

    // 非法 key → Zod 400
    const bad = await PUT(
      new Request("http://test/api/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ key: "not-a-key", enabled: true }),
      }),
    );
    expect(bad.status).toBe(400);
  });
});
