import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";
import {
  findByUserId,
  type UpsertUserBaselineInput,
  upsert,
} from "./userBaseline.repo";

async function seedUser(): Promise<string> {
  const user = await createUser({
    email: "baseline-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return user.id;
}

const VALID_INPUT: UpsertUserBaselineInput = {
  hormonalStatus: "cycling",
  skinType: "combination",
  fitzpatrickScale: "III",
  menopauseYear: null,
  concernGoals: ["acne", "pigmentation"],
};

describe("userBaseline.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("upsert (1:1)", () => {
    it("首次 upsert 创建基线记录", async () => {
      const userId = await seedUser();
      const baseline = await upsert(userId, VALID_INPUT);

      expect(baseline.userId).toBe(userId);
      expect(baseline.hormonalStatus).toBe("cycling");
      expect(baseline.skinType).toBe("combination");
      expect(baseline.fitzpatrickScale).toBe("III");
      expect(baseline.concernGoals).toEqual(["acne", "pigmentation"]);
    });

    it("二次 upsert 更新（非新建）同一行", async () => {
      const userId = await seedUser();
      const first = await upsert(userId, VALID_INPUT);
      const second = await upsert(userId, {
        ...VALID_INPUT,
        hormonalStatus: "pregnant",
        concernGoals: ["melasma"],
      });

      expect(second.id).toBe(first.id);
      expect(second.userId).toBe(userId);
      expect(second.hormonalStatus).toBe("pregnant");
      expect(second.concernGoals).toEqual(["melasma"]);
    });

    it("拒绝无效 hormonalStatus 枚举值", async () => {
      const userId = await seedUser();
      await expect(
        upsert(userId, {
          ...VALID_INPUT,
          // @ts-expect-error: 测试无效值
          hormonalStatus: "postmenopausal",
        }),
      ).rejects.toThrow();
    });
  });

  describe("findByUserId", () => {
    it("返回 1:1 基线记录", async () => {
      const userId = await seedUser();
      await upsert(userId, VALID_INPUT);

      const found = await findByUserId(userId);
      expect(found?.userId).toBe(userId);
      expect(found?.hormonalStatus).toBe("cycling");
    });

    it("用户无基线返回 null", async () => {
      const userId = await seedUser();
      const found = await findByUserId(userId);
      expect(found).toBeNull();
    });
  });
});
