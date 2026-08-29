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

const validUpload = {
  fileName: "lab.pdf",
  mime: "application/pdf",
  objectKey: "mock/lab.pdf",
  kind: "lab",
  recordedAt: "2026-03-01T00:00:00.000Z",
};

describe("POST /api/health/sources 上传", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST(jsonRequest(validUpload));
    expect(res.status).toBe(401);
  });

  it("非法 kind → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hs-bad@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ ...validUpload, kind: "bogus" }));
    expect(res.status).toBe(400);
  });

  it("登录用户上传 → 201 + sourceId/recordId，且 status=SOURCE_UPLOADED", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("hs-ok@example.com");
    asUser(user.id);

    const res = await POST(jsonRequest(validUpload));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sourceId).toBeTruthy();
    expect(body.recordId).toBeTruthy();

    // GET 列表能看到
    const list = await GET();
    const rows: Array<{ id: string; fileName: string }> = await list.json();
    expect(rows.some((r) => r.id === body.sourceId)).toBe(true);
    expect(rows[0].fileName).toBe(validUpload.fileName);
  });

  it("GET 列表仅返回当前用户", async () => {
    const { POST, GET } = await import("./route");
    const u1 = await makeUser("hs-u1@example.com");
    const u2 = await makeUser("hs-u2@example.com");
    asUser(u1.id);
    await POST(jsonRequest({ ...validUpload, fileName: "mine.pdf" }));
    asUser(u2.id);
    await POST(jsonRequest({ ...validUpload, fileName: "theirs.pdf" }));

    const list = await GET();
    const rows: Array<{ fileName: string }> = await list.json();
    expect(rows).toHaveLength(1);
    expect(rows[0].fileName).toBe("theirs.pdf");
  });
});
