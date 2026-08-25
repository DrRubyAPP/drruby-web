import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetDatabase } from "./test-helpers";
import {
  type CreateUserAccountInput,
  create,
  findByEmail,
  findById,
  list,
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

    it("更新 timezone / image（task-35 扩展）", async () => {
      const created = await create(VALID_INPUT);
      const updated = await updateProfile(created.id, {
        timezone: "Asia/Shanghai",
        image: "https://cdn.example.com/avatar.png",
      });
      expect(updated.timezone).toBe("Asia/Shanghai");
      expect(updated.image).toBe("https://cdn.example.com/avatar.png");
      expect(updated.name).toBe(created.name); // 未传字段不动

      // image: null 清除
      const cleared = await updateProfile(created.id, { image: null });
      expect(cleared.image).toBeNull();
      expect(cleared.timezone).toBe("Asia/Shanghai");
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

  describe("list", () => {
    it("分页返回用户列表（按 createdAt 倒序）", async () => {
      // 用显式 createdAt 确保 ordering 确定性（避免毫秒级并发碰撞）
      const u1 = await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u1@x.com",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      });
      const u2 = await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u2@x.com",
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
      });
      const u3 = await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u3@x.com",
          createdAt: new Date("2026-01-03T00:00:00Z"),
        },
      });

      const { data, total } = await list({ page: 1, pageSize: 2 });

      expect(data).toHaveLength(2);
      expect(total).toBe(3);
      // 倒序：u3 → u2 → u1
      expect(data[0].id).toBe(u3.id);
      expect(data[1].id).toBe(u2.id);
    });

    it("分页第二页返回剩余用户", async () => {
      const u1 = await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u1@x.com",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      });
      await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u2@x.com",
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
      });
      await prisma.userAccount.create({
        data: {
          ...VALID_INPUT,
          email: "u3@x.com",
          createdAt: new Date("2026-01-03T00:00:00Z"),
        },
      });

      const { data, total } = await list({ page: 2, pageSize: 2 });

      expect(data).toHaveLength(1);
      expect(total).toBe(3);
      expect(data[0].id).toBe(u1.id);
    });

    it("按 email 部分匹配搜索（case-insensitive）", async () => {
      await create({ ...VALID_INPUT, email: "alice@example.com" });
      await create({ ...VALID_INPUT, email: "bob@example.com" });

      const { data, total } = await list({
        page: 1,
        pageSize: 20,
        search: "ALI",
      });

      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].email).toBe("alice@example.com");
    });

    it("按 name 部分匹配搜索", async () => {
      const a = await create({ ...VALID_INPUT, email: "a@x.com" });
      await updateProfile(a.id, { name: "Alice Wong" });
      const b = await create({ ...VALID_INPUT, email: "b@x.com" });
      await updateProfile(b.id, { name: "Bob Smith" });
      const c = await create({ ...VALID_INPUT, email: "c@x.com" });
      await updateProfile(c.id, { name: "Alice Bob" });

      const { data, total } = await list({
        page: 1,
        pageSize: 20,
        search: "alice",
      });

      // Alice Wong + Alice Bob
      expect(total).toBe(2);
      expect(data.map((u) => u.email).sort()).toEqual(["a@x.com", "c@x.com"]);
    });

    it("过滤已软删除用户（data 与 total 均不含）", async () => {
      const u1 = await create({ ...VALID_INPUT, email: "u1@x.com" });
      await create({ ...VALID_INPUT, email: "u2@x.com" });
      await softDelete(u1.id);

      const { data, total } = await list({ page: 1, pageSize: 20 });

      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0].email).toBe("u2@x.com");
    });

    it("search 空字符串等同无搜索", async () => {
      await create({ ...VALID_INPUT, email: "u1@x.com" });
      await create({ ...VALID_INPUT, email: "u2@x.com" });

      const { data, total } = await list({
        page: 1,
        pageSize: 20,
        search: "",
      });

      expect(total).toBe(2);
      expect(data).toHaveLength(2);
    });

    it("search 仅空白等同无搜索（trim）", async () => {
      await create({ ...VALID_INPUT, email: "u1@x.com" });

      const { total } = await list({
        page: 1,
        pageSize: 20,
        search: "   ",
      });

      expect(total).toBe(1);
    });

    it("select 排除 passwordHash / googleSub", async () => {
      await create({
        ...VALID_INPUT,
        passwordHash: "hashed_secret",
        googleSub: undefined,
      });

      const { data } = await list({ page: 1, pageSize: 20 });
      const row = data[0];

      expect(row).not.toHaveProperty("passwordHash");
      expect(row).not.toHaveProperty("googleSub");
    });

    it("分页超出范围返回空数组 + 正确 total", async () => {
      await create({ ...VALID_INPUT, email: "u1@x.com" });

      const { data, total } = await list({ page: 5, pageSize: 20 });

      expect(data).toHaveLength(0);
      expect(total).toBe(1);
    });
  });
});
