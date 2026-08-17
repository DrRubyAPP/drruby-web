import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { create, findById, listByUser } from "./aiReport.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

const USER_INPUT = {
  email: "ai-report-test@example.com",
  authProvider: "email",
  role: "user",
  passwordHash: "hashed_secret",
  emailVerified: false,
} as const;

const FINDINGS = [
  {
    level: "good",
    tag: "额头",
    title: "额头：稳定",
    desc: "最近一次扫描中该区域状态为稳定。",
  },
  {
    level: "alert",
    tag: "下颌线",
    title: "下颌线：需要注意",
    desc: "最近一次扫描中该区域状态为需要注意。",
  },
] as const;

async function makeUser(): Promise<string> {
  const user = await createUser({ ...USER_INPUT });
  return user.id;
}

describe("aiReport.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("create + findById", () => {
    it("写入并读回，findings/meta JSON 往返一致", async () => {
      const userId = await makeUser();
      const meta = {
        degraded: true,
        generatedAt: "2026-08-17T10:00:00.000Z",
      };

      const created = await create(userId, {
        type: "skin",
        title: "皮肤状态报告",
        summary: "整体平稳。",
        findings: [...FINDINGS],
        meta,
      });

      expect(created.id).toMatch(/^[a-z0-9]{20,}$/);
      expect(created.userId).toBe(userId);
      expect(created.type).toBe("skin");
      expect(created.createdAt).toBeInstanceOf(Date);

      const found = await findById(created.id);
      expect(found?.title).toBe("皮肤状态报告");
      expect(found?.findings).toEqual([...FINDINGS]);
      expect(found?.meta).toEqual(meta);
    });

    it("findings/meta 省略时落库为 null", async () => {
      const userId = await makeUser();
      const created = await create(userId, {
        type: "hormone",
        title: "激素周期报告",
        summary: "概览。",
      });

      expect(created.findings).toBeNull();
      expect(created.meta).toBeNull();
    });

    it("拒绝非法 type 枚举值", async () => {
      const userId = await makeUser();
      await expect(
        create(userId, {
          // @ts-expect-error: 测试无效值
          type: "xxx",
          title: "t",
          summary: "s",
        }),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it("拒绝非法 finding level 枚举值", async () => {
      const userId = await makeUser();
      await expect(
        create(userId, {
          type: "skin",
          title: "t",
          summary: "s",
          findings: [
            // @ts-expect-error: 测试无效值
            { level: "critical", tag: "额头", title: "t", desc: "d" },
          ],
        }),
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("listByUser", () => {
    it("type 过滤 + 分页（createdAt desc）", async () => {
      const userId = await makeUser();
      // 显式 createdAt 保证排序确定性
      await prisma.aiReport.create({
        data: {
          userId,
          type: "skin",
          title: "skin-1",
          summary: "s",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      });
      await prisma.aiReport.create({
        data: {
          userId,
          type: "skin",
          title: "skin-2",
          summary: "s",
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
      });
      await prisma.aiReport.create({
        data: {
          userId,
          type: "hormone",
          title: "hormone-1",
          summary: "s",
          createdAt: new Date("2026-01-03T00:00:00Z"),
        },
      });

      // type 过滤
      const skin = await listByUser(userId, {
        type: "skin",
        page: 1,
        pageSize: 2,
      });
      expect(skin.total).toBe(2);
      expect(skin.data).toHaveLength(2);
      expect(skin.data.map((r) => r.title)).toEqual(["skin-2", "skin-1"]);

      // 无 type 第二页：只剩 1 条（createdAt desc → 最早的 skin-1）
      const page2 = await listByUser(userId, { page: 2, pageSize: 2 });
      expect(page2.total).toBe(3);
      expect(page2.data).toHaveLength(1);
      expect(page2.data[0].title).toBe("skin-1");

      // 分页超出范围
      const page5 = await listByUser(userId, { page: 5, pageSize: 2 });
      expect(page5.data).toHaveLength(0);
      expect(page5.total).toBe(3);
    });

    it("只看本人的数据（userId 隔离）", async () => {
      const u1 = await makeUser();
      const u2 = await createUser({
        ...USER_INPUT,
        email: "other@example.com",
      });

      await create(u1, { type: "skin", title: "u1-report", summary: "s" });

      const u2List = await listByUser(u2.id, { page: 1, pageSize: 20 });
      expect(u2List.total).toBe(0);
      expect(u2List.data).toHaveLength(0);
    });

    it("非法 type 过滤值抛 ZodError", async () => {
      const userId = await makeUser();
      await expect(
        listByUser(userId, {
          // @ts-expect-error: 测试无效值
          type: "xxx",
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toBeInstanceOf(ZodError);
    });
  });
});
