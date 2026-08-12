import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetDatabase } from "./test-helpers";
import {
  type CreateUserAccountInput,
  create,
  findByEmail,
  findById,
  softDelete,
  softDeleteAndAnonymize,
  update,
  updateProfile,
} from "./userAccount.repo";

const VALID_INPUT: CreateUserAccountInput = {
  email: "alice@example.com",
  authProvider: "email",
  role: "user",
  passwordHash: "hashed_secret",
  emailVerified: false,
};

describe("userAccount.repo", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("create", () => {
    it("成功创建用户并返回完整记录", async () => {
      const user = await create(VALID_INPUT);

      expect(user.id).toMatch(/^[a-z0-9]{20,}$/);
      expect(user.email).toBe("alice@example.com");
      expect(user.authProvider).toBe("email");
      expect(user.role).toBe("user");
      expect(user.subscriptionTier).toBe("free");
      expect(user.timezone).toBe("UTC");
      expect(user.status).toBe("active");
      expect(user.emailVerified).toBe(false);
      expect(user.passwordHash).toBe("hashed_secret");
      expect(user.deletedAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("Google 登录用户：passwordHash 为 null，googleSub 写入", async () => {
      const user = await create({
        email: "bob@gmail.com",
        authProvider: "google",
        role: "user",
        googleSub: "google-sub-123",
        emailVerified: true,
      });

      expect(user.authProvider).toBe("google");
      expect(user.googleSub).toBe("google-sub-123");
      expect(user.passwordHash).toBeNull();
      expect(user.emailVerified).toBe(true);
    });

    it("拒绝无效 authProvider 枚举值", async () => {
      await expect(
        create({
          ...VALID_INPUT,
          // @ts-expect-error: 测试无效值
          authProvider: "apple",
        }),
      ).rejects.toThrow();
    });

    it("拒绝无效 role 枚举值", async () => {
      await expect(
        create({
          ...VALID_INPUT,
          // @ts-expect-error: 测试无效值
          role: "superuser",
        }),
      ).rejects.toThrow();
    });

    it("接受 role=admin（管理后台角色）", async () => {
      const user = await create({ ...VALID_INPUT, role: "admin" });
      expect(user.role).toBe("admin");
    });

    it("拒绝无效 subscriptionTier 枚举值", async () => {
      await expect(
        create({
          ...VALID_INPUT,
          // @ts-expect-error: 测试无效值
          subscriptionTier: "ultimate",
        }),
      ).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("根据 id 查到记录", async () => {
      const created = await create(VALID_INPUT);
      const found = await findById(created.id);
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe("alice@example.com");
    });

    it("id 不存在返回 null", async () => {
      const found = await findById("nonexistent_id");
      expect(found).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("大小写不敏感查找（A@x.com == a@x.com）", async () => {
      await create({ ...VALID_INPUT, email: "Alice@Example.COM" });

      const found = await findByEmail("alice@example.com");
      expect(found?.email).toBe("Alice@Example.COM");
    });

    it("邮箱不存在返回 null", async () => {
      const found = await findByEmail("nobody@example.com");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("成功更新字段", async () => {
      const created = await create(VALID_INPUT);
      const updated = await update(created.id, {
        subscriptionTier: "decision",
        timezone: "Asia/Shanghai",
        lastLoginAt: new Date("2026-06-24T10:00:00Z"),
      });

      expect(updated.subscriptionTier).toBe("decision");
      expect(updated.timezone).toBe("Asia/Shanghai");
      expect(updated.lastLoginAt).toEqual(new Date("2026-06-24T10:00:00Z"));
    });

    it("更新 status 字段经枚举校验", async () => {
      const created = await create(VALID_INPUT);
      const updated = await update(created.id, { status: "suspended" });
      expect(updated.status).toBe("suspended");
    });

    it("拒绝无效 status 枚举值", async () => {
      const created = await create(VALID_INPUT);
      await expect(
        update(created.id, {
          // @ts-expect-error: 测试无效值
          status: "banned",
        }),
      ).rejects.toThrow();
    });
  });

  describe("softDelete", () => {
    it("置 status=deleted + deletedAt 非空", async () => {
      const created = await create(VALID_INPUT);
      const deleted = await softDelete(created.id);

      expect(deleted.status).toBe("deleted");
      expect(deleted.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe("updateProfile", () => {
    it("仅更新 name", async () => {
      const created = await create(VALID_INPUT);
      const updated = await updateProfile(created.id, { name: "Ruby" });
      expect(updated.name).toBe("Ruby");
      expect(updated.email).toBe(VALID_INPUT.email);
    });
  });

  describe("softDeleteAndAnonymize", () => {
    it("行仍在、status=deleted、脱敏 email/name、清 session（不可逆）", async () => {
      const created = await create({ ...VALID_INPUT, googleSub: undefined });
      await update(created.id, {}); // 确保存在
      await prisma.userAccount.update({
        where: { id: created.id },
        data: { name: "Alice" },
      });
      await prisma.session.create({
        data: {
          id: "sess-anon-1",
          token: "tok-anon-1",
          userId: created.id,
          expiresAt: new Date("2999-01-01T00:00:00.000Z"),
        },
      });

      const anon = await softDeleteAndAnonymize(created.id);
      expect(anon.status).toBe("deleted");
      expect(anon.deletedAt).toBeInstanceOf(Date);
      expect(anon.email).toBe(`deleted+${created.id}@deleted.invalid`);
      expect(anon.name).toBeNull();
      expect(anon.passwordHash).toBeNull();

      // 行未被物理删除
      const still = await findById(created.id);
      expect(still).not.toBeNull();

      // session 清空
      const sessions = await prisma.session.findMany({
        where: { userId: created.id },
      });
      expect(sessions).toHaveLength(0);
    });
  });
});
