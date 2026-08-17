import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("GET /api/ai-reports/[id]", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDb();
  });
  afterEach(disconnectDb);

  async function seed() {
    const owner = await makeUser("ar-owner@example.com");
    const other = await makeUser("ar-other@example.com");
    const { aiReportRepo } = await import("@/lib/db");
    const row = await aiReportRepo.create(owner.id, {
      type: "body",
      title: "身体洞察报告",
      summary: "s",
      findings: [{ level: "warn", tag: "睡眠", title: "睡眠偏少", desc: "d" }],
      meta: { degraded: false },
    });
    return { owner, other, row };
  }

  it("本人 → 200 返回 DTO", async () => {
    const { GET } = await import("./route");
    const { owner, row } = await seed();
    asUser(owner.id);
    const res = await GET(new Request("http://test/api"), params(row.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(row.id);
    expect(body.type).toBe("body");
    expect(body.findings[0].level).toBe("warn");
    expect(body.createdAt).toEqual(expect.any(String));
  });

  it("他人报告 → 404（不暴露存在性）", async () => {
    const { GET } = await import("./route");
    const { other, row } = await seed();
    asUser(other.id);
    const res = await GET(new Request("http://test/api"), params(row.id));
    expect(res.status).toBe(404);
  });

  it("不存在 → 404", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("ar-none@example.com");
    asUser(user.id);
    const res = await GET(new Request("http://test/api"), params("no-such-id"));
    expect(res.status).toBe(404);
  });

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    asAnonymous();
    const res = await GET(new Request("http://test/api"), params("x"));
    expect(res.status).toBe(401);
  });
});
