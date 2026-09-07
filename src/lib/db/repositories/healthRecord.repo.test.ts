import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import { connect, disconnect } from "./decisionHealthRecord.repo";
import {
  advanceStatus,
  create,
  dismissConnect,
  findById,
  listByUser,
  softDelete,
  updateExtraction,
} from "./healthRecord.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "health-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("healthRecord.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create（默认 ocrStatus=pending，status=SOURCE_UPLOADED）+ findById", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "CBC panel",
      source: "your doctor",
      objectKey: "reports/cbc.pdf",
      recordedAt: new Date("2026-06-01T00:00:00Z"),
    });
    expect(rec.kind).toBe("lab");
    expect(rec.ocrStatus).toBe("pending");
    expect(rec.objectKey).toBe("reports/cbc.pdf");
    expect(rec.status).toBe("SOURCE_UPLOADED"); // task-42 状态机起点
    expect(rec.sourceId).toBeTruthy(); // 自动建 placeholder Source
    expect(rec.healthSource).toBeDefined(); // include healthSource

    const found = await findById(rec.id);
    expect(found?.id).toBe(rec.id);
    expect(found?.healthSource).toBeDefined();
  });

  it("create 支持 manual + parsedValues JSON 往返（status=CONFIRMED）", async () => {
    const userId = await seedUser();
    const parsed = { hemoglobin: 13.5, unit: "g/dL" };
    const rec = await create(userId, {
      kind: "checkup",
      title: "Annual physical",
      ocrStatus: "manual",
      parsedValues: parsed,
      recordedAt: new Date("2026-05-01T00:00:00Z"),
    });
    expect(rec.ocrStatus).toBe("manual");
    expect(rec.status).toBe("CONFIRMED"); // task-42：手动录入直接 CONFIRMED
    expect(rec.parsedValues).toEqual(parsed);
  });

  it("create 支持 medication/symptom/treatment（task-42 D6 扩展）", async () => {
    const userId = await seedUser();
    for (const kind of ["medication", "symptom", "treatment"] as const) {
      const rec = await create(userId, {
        kind,
        title: `${kind} entry`,
        recordedAt: new Date(),
      });
      expect(rec.kind).toBe(kind);
    }
  });

  it("create 接受显式 sourceId（不自动建 placeholder）", async () => {
    const userId = await seedUser();
    const { create: createSource } = await import("./healthSource.repo");
    const src = await createSource(userId, { fileName: "explicit.pdf" });
    const rec = await create(userId, {
      sourceId: src.id,
      kind: "lab",
      title: "With explicit source",
      recordedAt: new Date(),
    });
    expect(rec.sourceId).toBe(src.id);
    expect(rec.healthSource.id).toBe(src.id);
  });

  it("listByUser 按 recordedAt 倒序", async () => {
    const userId = await seedUser();
    await create(userId, {
      kind: "lab",
      title: "older",
      recordedAt: new Date("2026-01-01T00:00:00Z"),
    });
    await create(userId, {
      kind: "imaging",
      title: "newer",
      recordedAt: new Date("2026-07-01T00:00:00Z"),
    });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("newer"); // 倒序
    expect(rows[1].title).toBe("older");
  });

  it("listByUser 仅返回该用户数据", async () => {
    const userId = await seedUser();
    const other = await createUser({
      email: "health-other@example.com",
      authProvider: "email",
      role: "user",
    });
    await create(userId, {
      kind: "lab",
      title: "mine",
      recordedAt: new Date("2026-06-01T00:00:00Z"),
    });
    await create(other.id, {
      kind: "lab",
      title: "theirs",
      recordedAt: new Date("2026-06-01T00:00:00Z"),
    });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("mine");
  });

  it("拒绝非法 kind", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        // @ts-expect-error 测试无效值
        kind: "bloodwork",
        title: "x",
        recordedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("拒绝非法 ocrStatus", async () => {
    const userId = await seedUser();
    await expect(
      create(userId, {
        kind: "lab",
        title: "x",
        // @ts-expect-error 测试无效值
        ocrStatus: "ocr-ing",
        recordedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("advanceStatus 推进状态机（SOURCE_UPLOADED→PROCESSING→EXTRACTED_DRAFT→USER_REVIEW→CONFIRMED）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "state machine test",
      recordedAt: new Date(),
    });
    expect(rec.status).toBe("SOURCE_UPLOADED");

    const p = await advanceStatus(rec.id, "PROCESSING");
    expect(p.status).toBe("PROCESSING");

    const d = await advanceStatus(rec.id, "EXTRACTED_DRAFT");
    expect(d.status).toBe("EXTRACTED_DRAFT");

    const u = await advanceStatus(rec.id, "USER_REVIEW");
    expect(u.status).toBe("USER_REVIEW");

    const c = await advanceStatus(rec.id, "CONFIRMED");
    expect(c.status).toBe("CONFIRMED");
  });

  it("advanceStatus 允许 EXTRACTED_DRAFT→CONFIRMED 跳过 USER_REVIEW（req D3 允许直接 confirm）", async () => {
    // req 验收 1：用户可直接从 Draft 跳到 Confirmed，不必先走 USER_REVIEW
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "skip review",
      recordedAt: new Date(),
    });
    await advanceStatus(rec.id, "PROCESSING");
    await advanceStatus(rec.id, "EXTRACTED_DRAFT");
    const c = await advanceStatus(rec.id, "CONFIRMED");
    expect(c.status).toBe("CONFIRMED");
  });

  it("advanceStatus 拒绝非法 status", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "x",
      recordedAt: new Date(),
    });
    await expect(
      advanceStatus(
        rec.id, // @ts-expect-error 测试无效值
        "CONFIRM",
      ),
    ).rejects.toThrow();
  });

  it("advanceStatus 支持 FAILED：PROCESSING→FAILED，FAILED→PROCESSING（Retry，task-48 F5）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "failed path",
      recordedAt: new Date(),
    });
    await advanceStatus(rec.id, "PROCESSING");
    const f = await advanceStatus(rec.id, "FAILED");
    expect(f.status).toBe("FAILED");
    const r = await advanceStatus(rec.id, "PROCESSING"); // Retry 合法
    expect(r.status).toBe("PROCESSING");
  });

  it("advanceStatus 拒绝非法转移（SOURCE_UPLOADED→CONFIRMED 抛 ILLEGAL_STATUS_TRANSITION，task-48 F5）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "illegal transition",
      recordedAt: new Date(),
    });
    await expect(advanceStatus(rec.id, "CONFIRMED")).rejects.toMatchObject({
      code: "ILLEGAL_STATUS_TRANSITION",
    });
    // PROCESSING→CONFIRMED 也非法（必须先到 EXTRACTED_DRAFT）
    await advanceStatus(rec.id, "PROCESSING");
    await expect(advanceStatus(rec.id, "CONFIRMED")).rejects.toMatchObject({
      code: "ILLEGAL_STATUS_TRANSITION",
    });
    // CONFIRMED 是终态，无合法后继
    await advanceStatus(rec.id, "EXTRACTED_DRAFT");
    await advanceStatus(rec.id, "CONFIRMED");
    await expect(advanceStatus(rec.id, "PROCESSING")).rejects.toMatchObject({
      code: "ILLEGAL_STATUS_TRANSITION",
    });
  });

  it("advanceStatus 记录不存在抛 NOT_FOUND（task-48 F5）", async () => {
    await expect(
      advanceStatus("nonexistent-id", "PROCESSING"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("updateExtraction 写入抽取结果（confidence/documentClass/parsedValues）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "extract test",
      recordedAt: new Date(),
    });
    const updated = await updateExtraction(rec.id, {
      status: "EXTRACTED_DRAFT",
      confidence: "High",
      documentClass: "Lab",
      parsedValues: { items: [{ name: "LDL", value: 130 }] },
    });
    expect(updated.status).toBe("EXTRACTED_DRAFT");
    expect(updated.confidence).toBe("High");
    expect(updated.documentClass).toBe("Lab");
    expect(updated.parsedValues).toEqual({
      items: [{ name: "LDL", value: 130 }],
    });
  });

  it("updateExtraction 写 pleaseConfirm + extractionError，Retry 成功后 error 可清空（task-48 F3/F4）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "please confirm test",
      recordedAt: new Date(),
    });
    // 抽取失败：落 FAILED + 用户安全文案
    await advanceStatus(rec.id, "PROCESSING");
    const failed = await updateExtraction(rec.id, {
      status: "FAILED",
      error: "PDF 暂不支持自动抽取，请手动录入",
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.extractionError).toBe("PDF 暂不支持自动抽取，请手动录入");

    // Retry 成功：写 pleaseConfirm，清空 error
    await advanceStatus(rec.id, "PROCESSING");
    const done = await updateExtraction(rec.id, {
      status: "EXTRACTED_DRAFT",
      confidence: "Low",
      documentClass: "Lab",
      parsedValues: { items: [{ name: "LDL", value: 130 }] },
      pleaseConfirm: ["ldl"],
      error: null,
    });
    expect(done.status).toBe("EXTRACTED_DRAFT");
    expect(done.pleaseConfirm).toEqual(["ldl"]);
    expect(done.extractionError).toBeNull();

    // 读回验证持久化
    const found = await findById(rec.id);
    expect(found?.pleaseConfirm).toEqual(["ldl"]);
    expect(found?.extractionError).toBeNull();
  });

  it("findById 含 revisions 修正历史（provenance）", async () => {
    const userId = await seedUser();
    const rec = await create(userId, {
      kind: "lab",
      title: "with revision",
      parsedValues: { original: true },
      recordedAt: new Date(),
    });
    const { create: createRevision } = await import(
      "./healthRecordRevision.repo"
    );
    await createRevision({
      recordId: rec.id,
      parsedValuesSnapshot: { original: true },
      newParsedValues: { corrected: true },
      diffSummary: "fixed LDL value",
      correctedBy: userId,
    });
    const found = await findById(rec.id);
    expect(found?.revisions).toHaveLength(1);
    expect(found?.revisions[0].diffSummary).toBe("fixed LDL value");
    expect(found?.parsedValues).toEqual({ corrected: true }); // current 指针已更新
  });

  describe("task-49 F3 · softDelete 软删除留痕", () => {
    it("置 deletedAt 非空；listByUser 不再返回该记录；行保留", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "soft delete me",
        recordedAt: new Date("2026-09-01T00:00:00Z"),
      });

      const deleted = await softDelete(rec.id);
      expect(deleted.deletedAt).toBeInstanceOf(Date);

      // 列表过滤软删
      const rows = await listByUser(userId);
      expect(rows.find((r) => r.id === rec.id)).toBeUndefined();

      // 行仍在（留痕，非物理删除）
      const raw = await prisma.healthRecord.findUniqueOrThrow({
        where: { id: rec.id },
      });
      expect(raw.deletedAt).not.toBeNull();
    });

    it("记录不存在抛 NOT_FOUND(404)", async () => {
      await expect(softDelete("nonexistent_id")).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });

    it("重复软删幂等（仅再次置时间戳，不抛错）", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "delete twice",
        recordedAt: new Date(),
      });

      await softDelete(rec.id);
      const again = await softDelete(rec.id);
      expect(again.deletedAt).toBeInstanceOf(Date);
    });

    it("软删记录不出现在列表，活跃记录保留", async () => {
      const userId = await seedUser();
      const keep = await create(userId, {
        kind: "lab",
        title: "keep me",
        recordedAt: new Date("2026-09-01T00:00:00Z"),
      });
      const drop = await create(userId, {
        kind: "lab",
        title: "drop me",
        recordedAt: new Date("2026-09-02T00:00:00Z"),
      });

      await softDelete(drop.id);
      const rows = await listByUser(userId);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(keep.id);
    });
  });

  describe("task-49 D-1 · dismissConnect 暂不处理落库", () => {
    it("置 connectDismissedAt 非空", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "dismiss me",
        recordedAt: new Date(),
      });

      const updated = await dismissConnect(rec.id);
      expect(updated.connectDismissedAt).toBeInstanceOf(Date);
    });

    it("重复调用幂等不抛错（仅刷新时间戳）", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "dismiss twice",
        recordedAt: new Date(),
      });

      await dismissConnect(rec.id);
      const again = await dismissConnect(rec.id);
      expect(again.connectDismissedAt).toBeInstanceOf(Date);
    });

    it("connect 成功后 connectDismissedAt 清空（D-1 回到已处理状态）", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "dismiss then connect",
        recordedAt: new Date(),
      });
      const decision = await createDecision(userId, {
        question: "Try Thermage?",
      });

      await dismissConnect(rec.id);
      const dismissed = await prisma.healthRecord.findUniqueOrThrow({
        where: { id: rec.id },
      });
      expect(dismissed.connectDismissedAt).not.toBeNull();

      await connect(decision.id, rec.id, userId);
      const after = await prisma.healthRecord.findUniqueOrThrow({
        where: { id: rec.id },
      });
      expect(after.connectDismissedAt).toBeNull();
    });
  });

  describe("task-49 · listByUser 活跃连接计数", () => {
    it("_count.decisions：connect 后 =1，disconnect 后 =0", async () => {
      const userId = await seedUser();
      const rec = await create(userId, {
        kind: "lab",
        title: "count test",
        recordedAt: new Date(),
      });
      const decision = await createDecision(userId, {
        question: "Count connections?",
      });

      // 初始 0
      let rows = await listByUser(userId);
      expect(rows[0]._count.decisions).toBe(0);

      // connect 后 1
      await connect(decision.id, rec.id, userId);
      rows = await listByUser(userId);
      expect(rows[0]._count.decisions).toBe(1);

      // disconnect（软删关联）后回到 0
      await disconnect(decision.id, rec.id);
      rows = await listByUser(userId);
      expect(rows[0]._count.decisions).toBe(0);
    });
  });
});
