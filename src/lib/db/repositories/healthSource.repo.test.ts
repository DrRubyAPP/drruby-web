import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create, findById, listByUser } from "./healthSource.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "hs-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("healthSource.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create（V1 占位 objectKey）+ findById", async () => {
    const userId = await seedUser();
    const src = await create(userId, {
      fileName: "lab.pdf",
      mime: "application/pdf",
      objectKey: "mock/lab.pdf",
    });
    expect(src.fileName).toBe("lab.pdf");
    expect(src.objectKey).toBe("mock/lab.pdf");

    const found = await findById(src.id);
    expect(found?.id).toBe(src.id);
  });

  it("listByUser 按 uploadedAt 倒序", async () => {
    const userId = await seedUser();
    await create(userId, { fileName: "older.pdf" });
    await new Promise((r) => setTimeout(r, 10));
    await create(userId, { fileName: "newer.pdf" });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].fileName).toBe("newer.pdf");
    expect(rows[1].fileName).toBe("older.pdf");
  });

  it("listByUser 仅返回该用户数据", async () => {
    const userId = await seedUser();
    const other = await createUser({
      email: "hs-other@example.com",
      authProvider: "email",
      role: "user",
    });
    await create(userId, { fileName: "mine.pdf" });
    await create(other.id, { fileName: "theirs.pdf" });
    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0].fileName).toBe("mine.pdf");
  });

  it("findById 含 1:1 record 关联", async () => {
    const userId = await seedUser();
    const src = await create(userId, { fileName: "with-record.pdf" });
    await prisma.healthRecord.create({
      data: {
        userId,
        sourceId: src.id,
        kind: "lab",
        title: "Lab report",
        status: "SOURCE_UPLOADED",
        recordedAt: new Date(),
      },
    });
    const found = await findById(src.id);
    expect(found?.record).not.toBeNull();
    expect(found?.record?.title).toBe("Lab report");
  });
});
