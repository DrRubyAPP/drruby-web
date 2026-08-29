import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createRecord } from "./healthRecord.repo";
import { create, listByRecord } from "./healthRecordRevision.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "rev-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

describe("healthRecordRevision.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create 追加修正记录 + 同步更新 Record.parsedValues（current 指针）", async () => {
    const userId = await seedUser();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "with revision",
      parsedValues: { ldl: 130 },
      recordedAt: new Date(),
    });

    const rev = await create({
      recordId: rec.id,
      parsedValuesSnapshot: { ldl: 130 },
      newParsedValues: { ldl: 110 },
      diffSummary: "user corrected LDL",
      correctedBy: userId,
      reason: "typo in original",
    });
    expect(rev.recordId).toBe(rec.id);
    expect(rev.diffSummary).toBe("user corrected LDL");
    expect(rev.correctedBy).toBe(userId);

    // current 指针已更新
    const updated = await prisma.healthRecord.findUniqueOrThrow({
      where: { id: rec.id },
    });
    expect(updated.parsedValues).toEqual({ ldl: 110 });
  });

  it("create 是 append-only（多次修正产生多条 revision）", async () => {
    const userId = await seedUser();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "multi-rev",
      parsedValues: { v: 1 },
      recordedAt: new Date(),
    });

    await create({
      recordId: rec.id,
      parsedValuesSnapshot: { v: 1 },
      newParsedValues: { v: 2 },
      diffSummary: "1→2",
      correctedBy: userId,
    });
    await new Promise((r) => setTimeout(r, 10));
    await create({
      recordId: rec.id,
      parsedValuesSnapshot: { v: 2 },
      newParsedValues: { v: 3 },
      diffSummary: "2→3",
      correctedBy: userId,
    });

    const revs = await listByRecord(rec.id);
    expect(revs).toHaveLength(2);
    expect(revs[0].diffSummary).toBe("2→3"); // 最新在前
    expect(revs[1].diffSummary).toBe("1→2");

    // current 指针指向最新
    const updated = await prisma.healthRecord.findUniqueOrThrow({
      where: { id: rec.id },
    });
    expect(updated.parsedValues).toEqual({ v: 3 });
  });

  it("listByRecord 倒序（最新修正在前）", async () => {
    const userId = await seedUser();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "order test",
      parsedValues: { x: 0 },
      recordedAt: new Date(),
    });

    for (let i = 1; i <= 3; i++) {
      await create({
        recordId: rec.id,
        parsedValuesSnapshot: { x: i - 1 },
        newParsedValues: { x: i },
        diffSummary: `rev-${i}`,
        correctedBy: userId,
      });
      await new Promise((r) => setTimeout(r, 10));
    }

    const revs = await listByRecord(rec.id);
    expect(revs).toHaveLength(3);
    expect(revs[0].diffSummary).toBe("rev-3");
    expect(revs[2].diffSummary).toBe("rev-1");
  });

  it("listByRecord 仅返回该 record 的修正", async () => {
    const userId = await seedUser();
    const rec1 = await createRecord(userId, {
      kind: "lab",
      title: "rec1",
      recordedAt: new Date(),
    });
    const rec2 = await createRecord(userId, {
      kind: "lab",
      title: "rec2",
      recordedAt: new Date(),
    });
    await create({
      recordId: rec1.id,
      parsedValuesSnapshot: {},
      newParsedValues: { a: 1 },
      correctedBy: userId,
    });
    await create({
      recordId: rec2.id,
      parsedValuesSnapshot: {},
      newParsedValues: { b: 2 },
      correctedBy: userId,
    });
    const revs1 = await listByRecord(rec1.id);
    const revs2 = await listByRecord(rec2.id);
    expect(revs1).toHaveLength(1);
    expect(revs2).toHaveLength(1);
  });
});
