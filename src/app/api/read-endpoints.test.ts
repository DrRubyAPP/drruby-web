import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SP2 读端点抽查：不逐个写 route 测试，仅挑两条代表——
//   1) GET /api/decisions/[id] 越权 → 404（所有权守卫，不泄露他人资源存在性）
//   2) GET /api/studies 目录 ⋈ 入组投影正确
// 其余读端点靠已有 repo 单测 + 各 route 内 `*Response.parse()` 契约兜底。

// requireUser 的双通道（cookie / bearer）已在 require-user.test.ts 覆盖；
// 这里用可变 holder 直接注入当前用户，专注 route 投影/守卫逻辑。
let currentUserId = "";
vi.mock("@/lib/auth/session", () => ({
  requireUser: async () => ({ id: currentUserId }),
}));

describe("SP2 read endpoints (spot checks)", () => {
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

  it("GET /api/decisions/[id]：越权访问他人决策 → 404", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const { GET } = await import("./decisions/[id]/route");

    const owner = await createUser({
      email: "owner@example.com",
      authProvider: "email",
      role: "user",
    });
    const intruder = await createUser({
      email: "intruder@example.com",
      authProvider: "email",
      role: "user",
    });
    const decision = await decisionRepo.create(owner.id, {
      question: "Should I restart retinol?",
      goal: "even-tone",
      status: "considering",
    });

    // 入侵者请求 owner 的决策 → 按「不存在」处理
    currentUserId = intruder.id;
    const res = await GET(new Request("http://test/api/decisions/x"), {
      params: Promise.resolve({ id: decision.id }),
    });
    expect(res.status).toBe(404);

    // owner 自己请求 → 200 且含 brief 快照与 entries
    currentUserId = owner.id;
    const ok = await GET(new Request("http://test/api/decisions/x"), {
      params: Promise.resolve({ id: decision.id }),
    });
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.id).toBe(decision.id);
    expect(body.status).toBe("considering");
    expect(Array.isArray(body.entries)).toBe(true);
  });

  it("GET /api/studies：目录 ⋈ 入组投影（已入组 / 未入组招募中 / 排除已关闭）", async () => {
    const { create: createUser } = await import(
      "@/lib/db/repositories/userAccount.repo"
    );
    const studyRepo = await import("@/lib/db/repositories/researchStudy.repo");
    const enrollRepo = await import(
      "@/lib/db/repositories/studyEnrollment.repo"
    );
    const { GET } = await import("./studies/route");

    const user = await createUser({
      email: "studies@example.com",
      authProvider: "email",
      role: "user",
    });

    const enrolled = await studyRepo.create({
      name: "Sleep & Skin",
      recruitmentStatus: "recruiting",
    });
    const recruiting = await studyRepo.create({
      name: "Open Recruiting",
      recruitmentStatus: "recruiting",
    });
    const closed = await studyRepo.create({
      name: "Closed Study",
      recruitmentStatus: "closed",
    });

    await enrollRepo.enroll({
      studyId: enrolled.id,
      userId: user.id,
      status: "enrolled",
      arm: "device",
      consentGiven: true,
    });

    currentUserId = user.id;
    const res = await GET();
    expect(res.status).toBe(200);
    const body: Array<{
      id: string;
      status: string;
      arm?: string;
      consentGiven: boolean;
    }> = await res.json();

    const byId = new Map(body.map((s) => [s.id, s]));
    // 已入组：用 enrollment 投影
    expect(byId.get(enrolled.id)).toMatchObject({
      status: "enrolled",
      arm: "device",
      consentGiven: true,
    });
    // 未入组但招募中：invited / 未同意
    expect(byId.get(recruiting.id)).toMatchObject({
      status: "invited",
      consentGiven: false,
    });
    // 未入组 + 已关闭：不展示
    expect(byId.has(closed.id)).toBe(false);
  });
});
