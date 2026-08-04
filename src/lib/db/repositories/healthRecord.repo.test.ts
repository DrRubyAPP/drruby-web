import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findById, listByUser } from "./healthRecord.repo";
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

  it("create（默认 ocrStatus=pending）+ findById", async () => {
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

    const found = await findById(rec.id);
    expect(found?.id).toBe(rec.id);
  });

  it("create 支持 manual + parsedValues JSON 往返", async () => {
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
    expect(rec.parsedValues).toEqual(parsed);
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
});
