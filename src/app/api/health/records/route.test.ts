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

const validManual = {
  kind: "lab",
  title: "Manual LDL log",
  parsedValues: { ldl: 110, unit: "mg/dL" },
  recordedAt: "2026-03-01T00:00:00.000Z",
};

describe("POST /api/health/records 手动录入", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest(validManual));
    expect(res.status).toBe(401);
  });

  it("非法 kind → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hr-bad@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ ...validManual, kind: "bogus" }));
    expect(res.status).toBe(400);
  });

  it("手动录入直接 CONFIRMED（不走 Extractor）", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("hr-ok@example.com");
    asUser(user.id);

    const res = await POST(jsonRequest(validManual));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("CONFIRMED");
    expect(body.kind).toBe("lab");
    expect(body.title).toBe(validManual.title);
    expect(body.parsedValues).toEqual(validManual.parsedValues);
    expect(body.source).toBeDefined(); // 含 placeholder source
    expect(body.sourceId).toBeTruthy();

    // GET 列表能看到
    const list = await GET();
    const rows: Array<{ status: string }> = await list.json();
    expect(rows.some((r) => r.status === "CONFIRMED")).toBe(true);
  });

  it("GET 列表仅返回当前用户", async () => {
    const { POST, GET } = await import("./route");
    const u1 = await makeUser("hr-u1@example.com");
    const u2 = await makeUser("hr-u2@example.com");
    asUser(u1.id);
    await POST(jsonRequest({ ...validManual, title: "mine" }));
    asUser(u2.id);
    await POST(jsonRequest({ ...validManual, title: "theirs" }));

    const list = await GET();
    const rows: Array<{ title: string }> = await list.json();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("theirs");
  });

  it("medication/symptom/treatment kind 可手动录入（D6 扩展）", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hr-d6@example.com");
    asUser(user.id);
    for (const kind of ["medication", "symptom", "treatment"] as const) {
      const res = await POST(
        jsonRequest({ ...validManual, kind, title: `${kind} log` }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.kind).toBe(kind);
    }
  });
});
