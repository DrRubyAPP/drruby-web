import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createSource } from "@/lib/db/repositories/healthSource.repo";
import { resetDatabase } from "@/lib/db/repositories/test-helpers";
import { create as createUser } from "@/lib/db/repositories/userAccount.repo";
import type { HealthSource } from "~prisma/client";
import { MockExtractor } from "./extractor.mock";

async function seedSource(
  userId: string,
  fileName: string,
): Promise<HealthSource> {
  return createSource(userId, { fileName, objectKey: `mock/${fileName}` });
}

describe("MockExtractor", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("按 fileName 推断 documentClass（lab → Lab）", async () => {
    const u = await createUser({
      email: "ext-test@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "lab-report.pdf");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.status).toBe("done");
    expect(result.documentClass).toBe("Lab");
    expect(result.confidence).toBe("High");
  });

  it("按 fileName 推断 imaging", async () => {
    const u = await createUser({
      email: "ext-img@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "mri-scan.pdf");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.documentClass).toBe("Imaging");
  });

  it("未匹配关键词 → Unknown", async () => {
    const u = await createUser({
      email: "ext-unk@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "random-file.pdf");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.documentClass).toBe("Unknown");
  });

  it("Lab 返回固定 parsedValues（含 items 数组）", async () => {
    const u = await createUser({
      email: "ext-lab2@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "blood-test.pdf");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.parsedValues).toBeDefined();
    const parsed = result.parsedValues as { items: Array<{ name: string }> };
    expect(parsed.items.length).toBeGreaterThan(0);
    expect(parsed.items[0]).toHaveProperty("name");
    expect(parsed.items[0]).toHaveProperty("value");
    expect(parsed.items[0]).toHaveProperty("flag");
  });

  it("pleaseConfirm 字段返回（Contract §13 Please confirm 标记）", async () => {
    const u = await createUser({
      email: "ext-pc@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "lab.pdf");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.pleaseConfirm).toBeDefined();
    expect(Array.isArray(result.pleaseConfirm)).toBe(true);
    expect(result.pleaseConfirm?.length).toBeGreaterThan(0);
  });

  it("configureFailure(true) → 下次 extract 返回 FAILED", async () => {
    const u = await createUser({
      email: "ext-fail@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "lab.pdf");
    const ext = new MockExtractor();
    ext.configureFailure(true);
    const result = await ext.extract(src);
    expect(result.status).toBe("failed");
    expect(result.error).toBeTruthy();
    expect(result.parsedValues).toBeUndefined();
  });

  it("configureFailure 一次性触发（下次恢复 done）", async () => {
    const u = await createUser({
      email: "ext-recover@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "lab.pdf");
    const ext = new MockExtractor();
    ext.configureFailure(true);
    const failed = await ext.extract(src);
    expect(failed.status).toBe("failed");
    const ok = await ext.extract(src);
    expect(ok.status).toBe("done");
  });

  it("大小写不敏感（fileName 含 Lab 也命中）", async () => {
    const u = await createUser({
      email: "ext-case@example.com",
      authProvider: "email",
      role: "user",
    });
    const src = await seedSource(u.id, "Lab-Report.PDF");
    const ext = new MockExtractor();
    const result = await ext.extract(src);
    expect(result.documentClass).toBe("Lab");
  });

  it("pathology / procedure / visitSummary 关键词命中", async () => {
    const u = await createUser({
      email: "ext-multi@example.com",
      authProvider: "email",
      role: "user",
    });
    const ext = new MockExtractor();
    for (const [fileName, expected] of [
      ["pathology-report.pdf", "Pathology"],
      ["procedure-notes.pdf", "Procedure"],
      ["visit-summary.pdf", "VisitSummary"],
    ] as const) {
      const src = await seedSource(u.id, fileName);
      const result = await ext.extract(src);
      expect(result.documentClass).toBe(expected);
    }
  });
});
