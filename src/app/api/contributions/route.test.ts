import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// requireUser 用可变 holder 注入当前用户（模式同 read-endpoints.test.ts）
let currentUserId = "";
vi.mock("@/lib/auth/session", () => ({
  requireUser: async () => ({ id: currentUserId }),
}));

describe("POST /api/contributions", () => {
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

  it("合法入参 → 201 落库，shared 默认 false", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const { prisma } = await import("@/lib/db/prisma");
    const { POST } = await import("./route");

    const user = await createUser({
      email: "contrib-post@example.com",
      authProvider: "email",
      role: "user",
    });
    currentUserId = user.id;

    const res = await POST(
      new Request("http://test/api/contributions", {
        method: "POST",
        body: JSON.stringify({
          title: "My Thermage story",
          description: "Gradual firmness over 3 months.",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      title: "My Thermage story",
      shared: false,
    });

    const row = await prisma.contribution.findFirst({
      where: { userId: user.id },
    });
    expect(row?.description).toBe("Gradual firmness over 3 months.");
    expect(row?.shared).toBe(false);
  });

  it("shared=true → 落库并记 sharedAt", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const { prisma } = await import("@/lib/db/prisma");
    const { POST } = await import("./route");

    const user = await createUser({
      email: "contrib-shared@example.com",
      authProvider: "email",
      role: "user",
    });
    currentUserId = user.id;

    const res = await POST(
      new Request("http://test/api/contributions", {
        method: "POST",
        body: JSON.stringify({
          title: "Shared story",
          description: "Willing to publish.",
          shared: true,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const row = await prisma.contribution.findFirst({
      where: { userId: user.id },
    });
    expect(row?.shared).toBe(true);
    expect(row?.sharedAt).not.toBeNull();
  });

  it("title 空 → 400（Zod）", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const { POST } = await import("./route");

    const user = await createUser({
      email: "contrib-invalid@example.com",
      authProvider: "email",
      role: "user",
    });
    currentUserId = user.id;

    const res = await POST(
      new Request("http://test/api/contributions", {
        method: "POST",
        body: JSON.stringify({ title: "", description: "x" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
