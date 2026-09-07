import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtractionResult } from "@/lib/health/extractor";
import {
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";
import type { HealthSource } from "~prisma/client";

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

  it("PATCH action=advance EXTRACTED_DRAFT→CONFIRMED 跳过 USER_REVIEW（req D3 允许直接 confirm）", async () => {
    const { PATCH } = await import("./route");
    const user = await makeUser("rec-skip@example.com");
    asUser(user.id);
    const rec = await seedRecord(user.id);
    const { healthRecordRepo } = await import("@/lib/db");
    await healthRecordRepo.advanceStatus(rec.id, "PROCESSING");
    await healthRecordRepo.advanceStatus(rec.id, "EXTRACTED_DRAFT");

    const res = await PATCH(
      jsonRequest(
        { action: "advance", status: "CONFIRMED" },
        { method: "PATCH" },
      ),
      params(rec.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("CONFIRMED");
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

// =============================================================================
// task-48 T4：POST = 抽取 trigger（D-9：前端触发 + 轮询；并入原 Retry 语义）
// =============================================================================

/** 播种带真实 Source 元数据（mime/hash/objectKey）的 record */
async function seedRecordWithSource(
  userId: string,
  opts?: {
    mime?: string;
    hash?: string;
    objectKey?: string;
    status?: string;
  },
) {
  const { healthRecordRepo, healthSourceRepo } = await import("@/lib/db");
  const src = await healthSourceRepo.create(userId, {
    fileName: opts?.mime === "application/pdf" ? "report.pdf" : "lab.png",
    mime: opts?.mime ?? "image/png",
    hash: opts?.hash ?? "hash-t4",
    objectKey: opts?.objectKey ?? "health/u1/src1/x.png",
  });
  return healthRecordRepo.create(userId, {
    kind: "lab",
    title: "trigger test",
    status: opts?.status as never,
    sourceId: src.id,
    recordedAt: new Date(),
  });
}

function fakeExtractor(result: ExtractionResult) {
  const extract = vi.fn(async (_source: HealthSource) => result);
  return { extractor: { extract }, extract };
}

const DONE_RESULT: ExtractionResult = {
  status: "done",
  parsedValues: { items: [{ name: "LDL", value: 130, unit: "mg/dL" }] },
  confidence: "Low",
  documentClass: "Lab",
  pleaseConfirm: ["LDL"],
};

describe("POST /api/health/records/[id]（抽取 trigger，task-48 F2）", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("图片 record → trigger → EXTRACTED_DRAFT + parsedValues + pleaseConfirm", async () => {
    const { POST, __setExtractor } = await import("./route");
    const user = await makeUser("rec-trig@example.com");
    asUser(user.id);
    const rec = await seedRecordWithSource(user.id);
    const { extractor, extract } = fakeExtractor(DONE_RESULT);
    __setExtractor(extractor);

    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("EXTRACTED_DRAFT");
    expect(body.parsedValues).toEqual({
      items: [{ name: "LDL", value: 130, unit: "mg/dL" }],
    });
    expect(body.confidence).toBe("Low");
    expect(body.documentClass).toBe("Lab");
    expect(body.pleaseConfirm).toEqual(["LDL"]);
    expect(body.error).toBeNull();
    // extractor 收到完整 source（含 objectKey/mime）
    expect(extract).toHaveBeenCalledTimes(1);
    expect(extract.mock.calls[0][0].objectKey).toBe("health/u1/src1/x.png");
    expect(extract.mock.calls[0][0].mime).toBe("image/png");
  });

  it("PDF → FAILED + 引导手输文案，原件保留（F4/D-8）", async () => {
    const { POST, __setExtractor } = await import("./route");
    const user = await makeUser("rec-pdf@example.com");
    asUser(user.id);
    const rec = await seedRecordWithSource(user.id, {
      mime: "application/pdf",
      objectKey: "health/u1/src1/x.pdf",
    });
    // 真实 OpenAiExtractor 对 PDF 的行为：不打模型直接 failed
    __setExtractor({
      extract: async () => ({
        status: "failed",
        error: "PDF 暂不支持自动抽取，请手动录入",
      }),
    });

    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("FAILED");
    expect(body.error).toBe("PDF 暂不支持自动抽取，请手动录入");
    // 原件保留（F4：不删除 Source）
    const { healthSourceRepo } = await import("@/lib/db");
    const found = await healthSourceRepo.findById(rec.sourceId);
    expect(found).not.toBeNull();
    expect(found?.objectKey).toBe("health/u1/src1/x.pdf");
  });

  it("越权 → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("rec-trig-owner@example.com");
    const intruder = await makeUser("rec-trig-intruder@example.com");
    asUser(owner.id);
    const rec = await seedRecordWithSource(owner.id);
    asUser(intruder.id);
    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(404);
  });

  it("同 hash 二次 trigger 命中缓存，不打 extractor（F6）", async () => {
    const { POST, __setExtractor } = await import("./route");
    const user = await makeUser("rec-cache@example.com");
    asUser(user.id);
    const first = await seedRecordWithSource(user.id, { hash: "same-hash" });
    const second = await seedRecordWithSource(user.id, { hash: "same-hash" });
    const { extractor, extract } = fakeExtractor(DONE_RESULT);
    __setExtractor(extractor);

    // 第一次：打 extractor
    const r1 = await POST(bareRequest("POST"), params(first.id));
    expect(r1.status).toBe(200);
    expect((await r1.json()).status).toBe("EXTRACTED_DRAFT");
    expect(extract).toHaveBeenCalledTimes(1);

    // 第二次（同 hash 新 record）：命中缓存，extractor 不再被调用
    const r2 = await POST(bareRequest("POST"), params(second.id));
    expect(r2.status).toBe(200);
    const body = await r2.json();
    expect(body.status).toBe("EXTRACTED_DRAFT");
    expect(body.parsedValues).toEqual(DONE_RESULT.parsedValues);
    expect(body.confidence).toBe("Low");
    expect(body.documentClass).toBe("Lab");
    expect(body.pleaseConfirm).toEqual(["LDL"]);
    expect(extract).toHaveBeenCalledTimes(1); // 没有第二次调用
  });

  it("FAILED record 再 trigger（Retry）合法：FAILED→PROCESSING→终态", async () => {
    const { POST, __setExtractor } = await import("./route");
    const user = await makeUser("rec-retry2@example.com");
    asUser(user.id);
    // 先让第一次抽取失败
    const rec = await seedRecordWithSource(user.id);
    __setExtractor({
      extract: async () => ({
        status: "failed",
        error: "抽取失败，请重试或手动录入",
      }),
    });
    const r1 = await POST(bareRequest("POST"), params(rec.id));
    expect((await r1.json()).status).toBe("FAILED");

    // Retry：换成功 extractor，走 FAILED→PROCESSING→EXTRACTED_DRAFT
    __setExtractor(fakeExtractor(DONE_RESULT).extractor);
    const r2 = await POST(bareRequest("POST"), params(rec.id));
    expect(r2.status).toBe(200);
    const body = await r2.json();
    expect(body.status).toBe("EXTRACTED_DRAFT");
    expect(body.error).toBeNull(); // Retry 成功清空历史失败原因
  });

  it("CONFIRMED record trigger → 409 非法状态转移（F5）", async () => {
    const { POST, __setExtractor } = await import("./route");
    const user = await makeUser("rec-conf@example.com");
    asUser(user.id);
    const rec = await seedRecordWithSource(user.id, { status: "CONFIRMED" });
    const { extractor, extract } = fakeExtractor(DONE_RESULT);
    __setExtractor(extractor);

    const res = await POST(bareRequest("POST"), params(rec.id));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
    expect(extract).not.toHaveBeenCalled();
  });
});
