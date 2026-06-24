import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  type CreateStudySessionInput,
  create,
  findActiveByUserId,
  softDelete,
  transitionStatus,
} from "./studySession.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const user = await createUser({
    email: "session-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return user.id;
}

function buildInput(userId: string): CreateStudySessionInput {
  return {
    userId,
    questionnaireAt: new Date("2026-01-01T00:00:00Z"),
    status: "pending_first_capture",
    preferredCaptureWindow: "morning",
    interventionSide: "left",
    controlSide: "right",
    consentAt: new Date("2026-01-01T00:00:00Z"),
    washoutStatus: "not_started",
  };
}

describe("studySession.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("create", () => {
    it("成功创建 session", async () => {
      const userId = await seedUser();
      const session = await create(buildInput(userId));

      expect(session.userId).toBe(userId);
      expect(session.status).toBe("pending_first_capture");
      expect(session.interventionSide).toBe("left");
      expect(session.controlSide).toBe("right");
      expect(session.washoutStatus).toBe("not_started");
      expect(session.currentWeek).toBe(0);
      expect(session.totalPausedDay).toBe(0);
    });

    it("拒绝无效 status 枚举值", async () => {
      const userId = await seedUser();
      await expect(
        create({
          ...buildInput(userId),
          // @ts-expect-error: 测试无效值
          status: "running",
        }),
      ).rejects.toThrow();
    });

    it("拒绝无效 washoutStatus 枚举值", async () => {
      const userId = await seedUser();
      await expect(
        create({
          ...buildInput(userId),
          // @ts-expect-error: 测试无效值
          washoutStatus: "done",
        }),
      ).rejects.toThrow();
    });
  });

  describe("findActiveByUserId", () => {
    it("返回 active session（未软删除）", async () => {
      const userId = await seedUser();
      await create({ ...buildInput(userId), status: "active" });

      const active = await findActiveByUserId(userId);
      expect(active?.userId).toBe(userId);
      expect(active?.status).toBe("active");
      expect(active?.deletedAt).toBeNull();
    });

    it("无 active session 返回 null", async () => {
      const userId = await seedUser();
      await create(buildInput(userId)); // pending_first_capture

      const active = await findActiveByUserId(userId);
      expect(active).toBeNull();
    });
  });

  describe("transitionStatus (状态机)", () => {
    it("合法转移：pending_first_capture → active", async () => {
      const userId = await seedUser();
      const session = await create(buildInput(userId));
      const updated = await transitionStatus(session.id, "active");

      expect(updated.status).toBe("active");
    });

    it("合法转移：active → paused（写 pausedAt）", async () => {
      const userId = await seedUser();
      const session = await create({ ...buildInput(userId), status: "active" });
      const updated = await transitionStatus(session.id, "paused");

      expect(updated.status).toBe("paused");
      expect(updated.pausedAt).toBeInstanceOf(Date);
    });

    it("合法转移：paused → active（写 resumedAt）", async () => {
      const userId = await seedUser();
      const session = await create({ ...buildInput(userId), status: "paused" });
      const updated = await transitionStatus(session.id, "active");

      expect(updated.status).toBe("active");
      expect(updated.resumedAt).toBeInstanceOf(Date);
    });

    it("合法转移：active → completed", async () => {
      const userId = await seedUser();
      const session = await create({ ...buildInput(userId), status: "active" });
      const updated = await transitionStatus(session.id, "completed");
      expect(updated.status).toBe("completed");
    });

    it("合法转移：active → abandoned", async () => {
      const userId = await seedUser();
      const session = await create({ ...buildInput(userId), status: "active" });
      const updated = await transitionStatus(session.id, "abandoned");
      expect(updated.status).toBe("abandoned");
    });

    it("非法转移：pending_first_capture → paused（必须先 active）", async () => {
      const userId = await seedUser();
      const session = await create(buildInput(userId));
      await expect(transitionStatus(session.id, "paused")).rejects.toThrow(
        /非法状态转移/,
      );
    });

    it("非法转移：completed → active（终态不可转出）", async () => {
      const userId = await seedUser();
      const session = await create({
        ...buildInput(userId),
        status: "completed",
      });
      await expect(transitionStatus(session.id, "active")).rejects.toThrow(
        /非法状态转移/,
      );
    });
  });

  describe("softDelete", () => {
    it("置 deletedAt 非空", async () => {
      const userId = await seedUser();
      const session = await create(buildInput(userId));
      const deleted = await softDelete(session.id);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
    });
  });
});
