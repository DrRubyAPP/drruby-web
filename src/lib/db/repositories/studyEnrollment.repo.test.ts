import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { create as createStudy } from "./researchStudy.repo";
import { enroll, listByUser, withdraw } from "./studyEnrollment.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seed(): Promise<{ userId: string; studyId: string }> {
  const u = await createUser({
    email: "enrollment-test@example.com",
    authProvider: "email",
    role: "user",
  });
  const s = await createStudy({
    name: "Sleep Study",
    recruitmentStatus: "recruiting",
  });
  return { userId: u.id, studyId: s.id };
}

describe("studyEnrollment.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("enroll（含 consentAt）+ 重入更新非新建", async () => {
    const { userId, studyId } = await seed();
    const first = await enroll({
      studyId,
      userId,
      status: "invited",
      consentGiven: false,
    });
    expect(first.consentAt).toBeNull();

    const second = await enroll({
      studyId,
      userId,
      status: "enrolled",
      arm: "A",
      consentGiven: true,
    });
    expect(second.id).toBe(first.id); // 唯一键：更新非新建
    expect(second.status).toBe("enrolled");
    expect(second.consentAt).not.toBeNull();

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1);
  });

  it("withdraw 保留记录并标记 withdrawnAt + 收回同意", async () => {
    const { userId, studyId } = await seed();
    await enroll({ studyId, userId, status: "enrolled", consentGiven: true });
    const withdrawn = await withdraw(studyId, userId);
    expect(withdrawn.withdrawnAt).not.toBeNull();
    expect(withdrawn.consentGiven).toBe(false);

    const rows = await listByUser(userId);
    expect(rows).toHaveLength(1); // 记录保留
  });

  it("拒绝非法 status", async () => {
    const { userId, studyId } = await seed();
    await expect(
      enroll({
        studyId,
        userId,
        // @ts-expect-error 测试无效值
        status: "pending",
        consentGiven: false,
      }),
    ).rejects.toThrow();
  });
});
