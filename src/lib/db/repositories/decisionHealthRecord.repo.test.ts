import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import {
  connect,
  disconnect,
  listByDecision,
} from "./decisionHealthRecord.repo";
import { create as createRecord } from "./healthRecord.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUserAndDecision(): Promise<{
  userId: string;
  decisionId: string;
}> {
  const u = await createUser({
    email: "dhr-test@example.com",
    authProvider: "email",
    role: "user",
  });
  const d = await createDecision(u.id, {
    question: "Try Thermage?",
    goal: "firmness",
  });
  return { userId: u.id, decisionId: d.id };
}

describe("decisionHealthRecord.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("connect 写入关联（removedAt=null）+ listByDecision 返回", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "lab for connect",
      recordedAt: new Date(),
    });

    await connect(decisionId, rec.id, userId);
    const links = await listByDecision(decisionId);
    expect(links).toHaveLength(1);
    expect(links[0].healthRecordId).toBe(rec.id);
    expect(links[0].connectedBy).toBe(userId);
    expect(links[0].removedAt).toBeNull();
    expect(links[0].healthRecord.title).toBe("lab for connect");
    expect(links[0].healthRecord.healthSource).toBeDefined();
  });

  it("connect 刷新 Decision.lastUserActivityAt（§8 meaningful activity）", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "for activity",
      recordedAt: new Date(),
    });

    const before = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    await new Promise((r) => setTimeout(r, 10));
    await connect(decisionId, rec.id, userId);
    const after = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    expect(after.lastUserActivityAt.getTime()).toBeGreaterThan(
      before.lastUserActivityAt.getTime(),
    );
  });

  it("disconnect 软删除（removedAt 设值）+ listByDecision 不再返回", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "for disconnect",
      recordedAt: new Date(),
    });

    await connect(decisionId, rec.id, userId);
    expect(await listByDecision(decisionId)).toHaveLength(1);

    await disconnect(decisionId, rec.id);
    expect(await listByDecision(decisionId)).toHaveLength(0); // removedAt=null 过滤

    // 留痕：raw 查询能看到 removedAt 非空
    const allLinks = await prisma.decisionHealthRecord.findMany({
      where: { decisionId },
    });
    expect(allLinks).toHaveLength(1);
    expect(allLinks[0].removedAt).not.toBeNull();
  });

  it("disconnect 刷新 Decision.lastUserActivityAt", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const rec = await createRecord(userId, {
      kind: "lab",
      title: "for disconnect activity",
      recordedAt: new Date(),
    });

    await connect(decisionId, rec.id, userId);
    await new Promise((r) => setTimeout(r, 10));
    const before = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    await new Promise((r) => setTimeout(r, 10));
    await disconnect(decisionId, rec.id);
    const after = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    expect(after.lastUserActivityAt.getTime()).toBeGreaterThan(
      before.lastUserActivityAt.getTime(),
    );
  });

  it("listByDecision 仅返回该 decision 的关联", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const other = await createUser({
      email: "dhr-other@example.com",
      authProvider: "email",
      role: "user",
    });
    const otherDecision = await createDecision(other.id, {
      question: "Other decision?",
    });

    const rec1 = await createRecord(userId, {
      kind: "lab",
      title: "rec1",
      recordedAt: new Date(),
    });
    const rec2 = await createRecord(other.id, {
      kind: "lab",
      title: "rec2",
      recordedAt: new Date(),
    });

    await connect(decisionId, rec1.id, userId);
    await connect(otherDecision.id, rec2.id, other.id);

    expect(await listByDecision(decisionId)).toHaveLength(1);
    expect(await listByDecision(otherDecision.id)).toHaveLength(1);
  });

  it("listByDecision 按 connectedAt 倒序（最新连接在前）", async () => {
    const { userId, decisionId } = await seedUserAndDecision();
    const rec1 = await createRecord(userId, {
      kind: "lab",
      title: "r1",
      recordedAt: new Date(),
    });
    const rec2 = await createRecord(userId, {
      kind: "lab",
      title: "r2",
      recordedAt: new Date(),
    });

    await connect(decisionId, rec1.id, userId);
    await new Promise((r) => setTimeout(r, 10));
    await connect(decisionId, rec2.id, userId);

    const links = await listByDecision(decisionId);
    expect(links).toHaveLength(2);
    expect(links[0].healthRecordId).toBe(rec2.id); // 最新在前
    expect(links[1].healthRecordId).toBe(rec1.id);
  });
});
