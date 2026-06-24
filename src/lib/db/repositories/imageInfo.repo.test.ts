import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  type CreateImageInfoInput,
  create,
  findBySessionAndWeek,
} from "./imageInfo.repo";
import { create as createSession } from "./studySession.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUserAndSession(): Promise<{
  userId: string;
  sessionId: string;
}> {
  const user = await createUser({
    email: "image-test@example.com",
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

function buildInput(userId: string, sessionId: string): CreateImageInfoInput {
  return {
    userId,
    sessionId,
    studyWeek: 0,
    s3ObjectKey: "s3://bucket/img-001.jpg",
    capturedAt: new Date("2026-01-08T08:00:00Z"),
    mcsLevel: "High",
    lightingScore: "pass",
    faceSide: "left",
    captureDevice: "phone_front",
  };
}

describe("imageInfo.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("create", () => {
    it("成功创建图像记录", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const img = await create(buildInput(userId, sessionId));

      expect(img.userId).toBe(userId);
      expect(img.sessionId).toBe(sessionId);
      expect(img.studyWeek).toBe(0);
      expect(img.faceSide).toBe("left");
      expect(img.captureDevice).toBe("phone_front");
      expect(img.deviceId).toBeNull();
    });

    it("拒绝无效 faceSide 枚举值", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create({
          ...buildInput(userId, sessionId),
          // @ts-expect-error: 测试无效值
          faceSide: "center",
        }),
      ).rejects.toThrow();
    });

    it("拒绝无效 captureDevice 枚举值", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create({
          ...buildInput(userId, sessionId),
          // @ts-expect-error: 测试无效值
          captureDevice: "dslr",
        }),
      ).rejects.toThrow();
    });

    it("拒绝无效 mcsLevel 枚举值（大小写敏感）", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create({
          ...buildInput(userId, sessionId),
          // @ts-expect-error: 测试无效值
          mcsLevel: "high",
        }),
      ).rejects.toThrow();
    });

    it("dermoscope 采集必须带 deviceId（repo 层校验）", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await expect(
        create({
          ...buildInput(userId, sessionId),
          captureDevice: "dermoscope",
          // 缺 deviceId
        }),
      ).rejects.toThrow(/dermoscope.*device_id/i);
    });
  });

  describe("findBySessionAndWeek", () => {
    it("返回指定 session + week 的图像列表", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      await create(buildInput(userId, sessionId));
      await create({
        ...buildInput(userId, sessionId),
        s3ObjectKey: "s3://bucket/img-002.jpg",
        faceSide: "right",
      });

      const images = await findBySessionAndWeek(sessionId, 0);
      expect(images).toHaveLength(2);
      expect(images.map((i) => i.faceSide).sort()).toEqual(["left", "right"]);
    });

    it("无匹配返回空数组", async () => {
      const { userId, sessionId } = await seedUserAndSession();
      const images = await findBySessionAndWeek(sessionId, 99);
      expect(images).toEqual([]);
    });
  });
});
