import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  computeDelta,
  degradeByCaptureCount,
  findBySessionAndWeek,
  type UpsertSisHistoryInput,
  upsert,
} from "./sisHistory.repo";
import { create as createSession } from "./studySession.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUserAndSession(): Promise<{
  userId: string;
  sessionId: string;
}> {
  const user = await createUser({
    email: "sis-test@example.com",
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
  week: number,
  overrides: Partial<UpsertSisHistoryInput> = {},
): UpsertSisHistoryInput {
  return {
    userId,
    sessionId,
    studyWeek: week,
    sisIntervention: 0.75,
    sisControl: 0.6,
    mcsLowest: "Medium",
    captureCount: 2,
    status: "computed",
    ...overrides,
  };
}

describe("sisHistory.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("upsert (基于 @@unique([sessionId, studyWeek]))", () => {
    it("首次 upsert 创建 SIS 记录，sisDelta 自动计算", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const record = await upsert(buildInput(userId, sessionId, 0));

      expect(record.sessionId).toBe(sessionId);
      expect(record.studyWeek).toBe(0);
      expect(record.sisIntervention!.toString()).toBe("0.75");
      expect(record.sisControl!.toString()).toBe("0.6");
      expect(record.sisDelta!.toString()).toBe("0.15"); // 0.75 - 0.6
      expect(record.status).toBe("computed");
    });

    it("二次 upsert 同一 (session, week) 更新而非新建", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const first = await upsert(buildInput(userId, sessionId, 0));
      const second = await upsert(
        buildInput(userId, sessionId, 0, {
          sisIntervention: 0.8,
          sisControl: 0.5,
        }),
      );

      expect(second.id).toBe(first.id);
      expect(second.sisDelta!.toString()).toBe("0.3"); // 0.8 - 0.5
    });

    it("拒绝无效 status 枚举值", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        upsert(
          buildInput(userId, sessionId, 0, {
            // @ts-expect-error: 测试无效值
            status: "failed",
          }),
        ),
      ).rejects.toThrow();
    });
  });

  describe("findBySessionAndWeek", () => {
    it("返回指定 session + week 的 SIS 记录", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await upsert(buildInput(userId, sessionId, 0));
      await upsert(buildInput(userId, sessionId, 1));

      const week0 = await findBySessionAndWeek(sessionId, 0);
      expect(week0?.studyWeek).toBe(0);

      const week1 = await findBySessionAndWeek(sessionId, 1);
      expect(week1?.studyWeek).toBe(1);

      const week99 = await findBySessionAndWeek(sessionId, 99);
      expect(week99).toBeNull();
    });
  });

  describe("computeDelta", () => {
    it("sis_intervention - sis_control = sis_delta", () => {
      expect(computeDelta(0.75, 0.6)).toBe(0.15);
      expect(computeDelta(0.5, 0.5)).toBe(0);
      expect(computeDelta(0.3, 0.6)).toBe(-0.3); // 负=刺激
    });

    it("任一为 null 返回 null", () => {
      expect(computeDelta(null, 0.6)).toBeNull();
      expect(computeDelta(0.75, null)).toBeNull();
      expect(computeDelta(null, null)).toBeNull();
    });
  });

  describe("degradeByCaptureCount", () => {
    it("2 次采集 → computed", () => {
      expect(degradeByCaptureCount(2)).toBe("computed");
    });

    it("1 次采集 → degraded", () => {
      expect(degradeByCaptureCount(1)).toBe("degraded");
    });

    it("0 次采集 → skipped", () => {
      expect(degradeByCaptureCount(0)).toBe("skipped");
    });

    it("null 视为 0 次 → skipped", () => {
      expect(degradeByCaptureCount(null)).toBe("skipped");
    });
  });
});
