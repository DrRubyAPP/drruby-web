import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBuckets } from "@/lib/auth/rate-limit";
import { AppError } from "@/lib/errors";
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

// 隔离生成逻辑——编排/降级已在 generate.test.ts 覆盖，这里只验 route 契约。
const generate = vi.fn();
vi.mock("@/lib/ai-reports/generate", () => ({
  generateAiReport: (userId: string, type: string) => generate(userId, type),
}));

/** 构造一条 AiReport 行（repo 返回形状，Date 字段） */
function fakeReport(over: Record<string, unknown> = {}) {
  const now = new Date("2026-08-17T00:00:00.000Z");
  return {
    id: "r-1",
    userId: "u-x",
    type: "skin",
    title: "皮肤状态报告",
    summary: "整体平稳。",
    findings: [
      { level: "good", tag: "水分", title: "保湿良好", desc: "保持现状" },
    ],
    meta: { degraded: true },
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

/** GET 列表请求（带 query） */
function listRequest(query = ""): Request {
  return new Request(`http://test/api/ai-reports${query}`);
}

describe("POST /api/ai-reports", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetBuckets();
    await resetDb();
  });
  afterEach(disconnectDb);

  it("未登录 → 401，不触发生成", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest({ type: "skin" }));
    expect(res.status).toBe(401);
    expect(generate).not.toHaveBeenCalled();
  });

  it("已登录 → 201 返回 DTO，generate 收到 (userId, type)", async () => {
    const { POST } = await import("./route");
    generate.mockResolvedValue(fakeReport());
    asUser("u-x");
    const res = await POST(jsonRequest({ type: "skin" }));
    expect(res.status).toBe(201);
    expect(generate).toHaveBeenCalledWith("u-x", "skin");
    expect(await res.json()).toEqual({
      id: "r-1",
      type: "skin",
      title: "皮肤状态报告",
      summary: "整体平稳。",
      findings: [
        { level: "good", tag: "水分", title: "保湿良好", desc: "保持现状" },
      ],
      meta: { degraded: true },
      createdAt: "2026-08-17T00:00:00.000Z",
      updatedAt: "2026-08-17T00:00:00.000Z",
    });
  });

  it("body type 非法 → 400 validation_error", async () => {
    const { POST } = await import("./route");
    generate.mockResolvedValue(fakeReport());
    asUser("u-bad");
    const res = await POST(jsonRequest({ type: "xxx" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
    expect(generate).not.toHaveBeenCalled();
  });

  it("数据源为空（generate 抛 insufficient_data）→ 422", async () => {
    const { POST } = await import("./route");
    generate.mockRejectedValue(
      new AppError("insufficient_data", "该类型暂无数据", 422),
    );
    asUser("u-empty");
    const res = await POST(jsonRequest({ type: "hormone" }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: { code: "insufficient_data", message: "该类型暂无数据" },
    });
  });

  it("连续 6 次 → 前 5 次 201、第 6 次 429 + Retry-After 600", async () => {
    const { POST } = await import("./route");
    generate.mockResolvedValue(fakeReport());
    asUser("u-rate");
    for (let i = 1; i <= 5; i++) {
      const res = await POST(jsonRequest({ type: "skin" }));
      expect(res.status, `第 ${i} 次`).toBe(201);
    }
    const sixth = await POST(jsonRequest({ type: "skin" }));
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("Retry-After")).toBe("600");
  });
});

describe("GET /api/ai-reports（列表）", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetBuckets();
    await resetDb();
  });
  afterEach(disconnectDb);

  async function seed() {
    const user = await makeUser("ar-list@example.com");
    const { aiReportRepo } = await import("@/lib/db");
    const mk = (type: "skin" | "hormone", title: string) =>
      aiReportRepo.create(user.id, {
        type,
        title,
        summary: "s",
        findings: [{ level: "good", tag: "t", title, desc: "d" }],
      });
    await mk("skin", "skin-1");
    await mk("hormone", "hormone-1");
    await mk("skin", "skin-2");
    return user;
  }

  it("默认分页：返回全部 3 条", async () => {
    const { GET } = await import("./route");
    const user = await seed();
    asUser(user.id);
    const res = await GET(listRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.data).toHaveLength(3);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.data[0].createdAt).toEqual(expect.any(String));
  });

  it("?type=skin 过滤 → total 2", async () => {
    const { GET } = await import("./route");
    const user = await seed();
    asUser(user.id);
    const res = await GET(listRequest("?type=skin"));
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.data.every((r: { type: string }) => r.type === "skin")).toBe(
      true,
    );
  });

  it("page 越界 → 空 data、total 不变", async () => {
    const { GET } = await import("./route");
    const user = await seed();
    asUser(user.id);
    const res = await GET(listRequest("?page=2"));
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.data).toEqual([]);
  });

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    asAnonymous();
    const res = await GET(listRequest());
    expect(res.status).toBe(401);
  });
});
