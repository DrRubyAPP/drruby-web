import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  advanceStatus,
  create,
  findById,
  listByUser,
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
});
