import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  type CreateInterventionLogInput,
  closeRegimeAndStartNew,
  create,
  findActiveBySession,
} from "./interventionLog.repo";
import { create as createSession } from "./studySession.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUserAndSession(): Promise<{
  userId: string;
  sessionId: string;
}> {
  const user = await createUser({
    email: "intervention-test@example.com",
    authProvider: "email",
    role: "user",
  });
  const session = await createSession({
    userId: user.id,
    questionnaireAt: new Date("2026-01-01T00:00:00Z"),
    status: "active",
    interventionSide: "left",
    controlSide: "right",
    consentAt: new Date("2026-01-01T00:00:00Z"),
    washoutStatus: "completed",
  });
  return { userId: user.id, sessionId: session.id };
}

function buildInput(
  userId: string,
  sessionId: string,
  overrides: Partial<CreateInterventionLogInput> = {},
): CreateInterventionLogInput {
  return {
    userId,
    sessionId,
    faceSide: "left",
    productName: "Retinol 0.3%",
    category: "retinoid",
    regimeStartDate: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("interventionLog.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("create", () => {
    it("成功创建 regime 记录", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const log = await create(buildInput(userId, sessionId));

      expect(log.userId).toBe(userId);
      expect(log.faceSide).toBe("left");
      expect(log.category).toBe("retinoid");
      expect(log.regimeEndDate).toBeNull(); // 当前 regime 未关闭
    });

    it("face_side=both（基础护肤，不计入 cohort）", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const log = await create(
        buildInput(userId, sessionId, {
          faceSide: "both",
          category: "moisturizer",
        }),
      );
      expect(log.faceSide).toBe("both");
    });

    it("拒绝无效 category 枚举值", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create(
          buildInput(userId, sessionId, {
            // @ts-expect-error: 测试无效值
            category: "unknown_cat",
          }),
        ),
      ).rejects.toThrow();
    });

    it("拒绝无效 faceSide 枚举值", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create(
          buildInput(userId, sessionId, {
            // @ts-expect-error: 测试无效值
            faceSide: "center",
          }),
        ),
      ).rejects.toThrow();
    });
  });

  describe("findActiveBySession", () => {
    it("返回 regime_end_date IS NULL 的记录（COALESCE 语义）", async () => {
      const { userId, sessionId } = await seedUserAndSession();

      // 当前 regime（未关闭）
      await create(buildInput(userId, sessionId, { productName: "A" }));
      // 已关闭的历史 regime
      await create(
        buildInput(userId, sessionId, {
          productName: "B",
          regimeEndDate: new Date("2026-02-01"),
        }),
      );

      const active = await findActiveBySession(sessionId);
      expect(active).toHaveLength(1);
      expect(active[0].productName).toBe("A");
      expect(active[0].regimeEndDate).toBeNull();
    });

    it("多侧并行 regime 都返回", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await create(
        buildInput(userId, sessionId, { faceSide: "left", productName: "L" }),
      );
      await create(
        buildInput(userId, sessionId, { faceSide: "right", productName: "R" }),
      );

      const active = await findActiveBySession(sessionId);
      expect(active).toHaveLength(2);
    });
  });

  describe("closeRegimeAndStartNew", () => {
    it("事务：关旧行 regime_end_date + 插新行", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const oldLog = await create(
        buildInput(userId, sessionId, { productName: "Old" }),
      );

      const newLog = await closeRegimeAndStartNew(oldLog.id, {
        userId,
        sessionId,
        faceSide: "left",
        productName: "New",
        category: "retinoid",
        regimeStartDate: new Date("2026-02-15"),
      });

      // 新行已创建
      expect(newLog.productName).toBe("New");
      expect(newLog.regimeEndDate).toBeNull();

      // 旧行已关闭
      const refreshed = await prisma.interventionLog.findUniqueOrThrow({
        where: { id: oldLog.id },
      });
      expect(refreshed.regimeEndDate).toBeInstanceOf(Date);
    });

    it("旧 log 不存在时事务回滚", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        closeRegimeAndStartNew("nonexistent_log_id", {
          userId,
          sessionId,
          faceSide: "left",
          productName: "New",
          category: "retinoid",
          regimeStartDate: new Date("2026-02-15"),
        }),
      ).rejects.toThrow();
    });
  });
});
