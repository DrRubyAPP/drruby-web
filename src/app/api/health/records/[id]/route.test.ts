import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

async function seedRecord(userId: string, opts?: { status?: string }) {
  const { healthRecordRepo } = await import("@/lib/db");
  return healthRecordRepo.create(userId, {
    kind: "lab",
    title: "test record",
    status: opts?.status as never,
    recordedAt: new Date(),
  });
}

describe("GET/PATCH/POST /api/health/records/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("GET 详情含原件 + 修正历史", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("rec-get@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id);

    const res = await GET(bareRequest("GET"), params(rec.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(rec.id);
    expect(body.source).toBeDefined();
    expect(body.revisions).toEqual([]); // 无修正历史
  });

  it("GET 越权 → 404（不泄露存在性）", async () => {
    const { GET } = await import("./route");
    const owner = await makeUser("rec-owner@example.com");
    const intruder = await makeUser("rec-intruder@example.com");
    asUser(owner.id);
    const rec = await seedRecord(owner.id);
    asUser(intruder.id);
    const res = await GET(bareRequest("GET"), params(rec.id));
    expect(res.status).toBe(404);
  });

  it("PATCH action=advance 推进状态机", async () => {
    const { PATCH } = await import("./route");
    const user = await makeUser("rec-adv@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id, { status: "SOURCE_UPLOADED" });

    const res = await PATCH(
      jsonRequest(
        { action: "advance", status: "PROCESSING" },
        { method: "PATCH" },
      ),
      params(rec.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PROCESSING");
  });

  it("PATCH action=advance 非法 status → 400", async () => {
    const { PATCH } = await import("./route");
    const user = await makeUser("rec-advbad@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id);

    const res = await PATCH(
      jsonRequest(
        { action: "advance", status: "CONFIRM" },
        { method: "PATCH" },
      ),
      params(rec.id),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH action=correct 追加 Revision + 同步更新 parsedValues（current 指针）", async () => {
    const { PATCH, GET } = await import("./route");
    const user = await makeUser("rec-correct@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id);
    // 初次抽取结果
    const { healthRecordRepo } = await import("@/lib/db");
    await healthRecordRepo.updateExtraction(rec.id, {
      status: "EXTRACTED_DRAFT",
      parsedValues: { ldl: 130 },
    });

    // 用户纠错
    const res = await PATCH(
      jsonRequest(
        {
          action: "correct",
          parsedValues: { ldl: 110 },
          diffSummary: "user corrected LDL",
          reason: "typo",
        },
        { method: "PATCH" },
      ),
      params(rec.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsedValues).toEqual({ ldl: 110 }); // current 已更新
    expect(body.revisions?.length).toBe(1);
    expect(body.revisions?.[0].diffSummary).toBe("user corrected LDL");
  });

  it("PATCH 越权 → 404", async () => {
    const { PATCH } = await import("./route");
    const owner = await makeUser("rec-correct-owner@example.com");
    const intruder = await makeUser("rec-correct-intruder@example.com");
    asUser(owner.id);
    const rec = await seedRecord(owner.id);
    asUser(intruder.id);
    const res = await PATCH(
      jsonRequest(
        { action: "advance", status: "PROCESSING" },
        { method: "PATCH" },
      ),
      params(rec.id),
    );
    expect(res.status).toBe(404);
  });

  it("PATCH action 缺失 → 400（discriminatedUnion 拒绝）", async () => {
    const { PATCH } = await import("./route");
    const user = await makeUser("rec-noaction@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id);
    const res = await PATCH(
      jsonRequest({ foo: "bar" }, { method: "PATCH" }),
      params(rec.id),
    );
    expect(res.status).toBe(400);
  });

  it("POST retry 推进到 PROCESSING（FAILED Retry 路径）", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("rec-retry@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id, { status: "SOURCE_UPLOADED" });

    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PROCESSING");
  });

  it("POST retry 越权 → 404", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("rec-retry-owner@example.com");
    const intruder = await makeUser("rec-retry-intruder@example.com");
    asUser(owner.id);
    const rec = await seedRecord(owner.id);
    asUser(intruder.id);
    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(404);
  });
});
