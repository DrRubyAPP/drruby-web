import type { ClinicUser } from "@/lib/auth/clinic";
import { AppError } from "@/lib/errors";

/**
 * route handler 集成测试脚手架
 * ============================
 *
 * 写端点测试统一走「mock session + 真实 DB」：
 * - 用可变 holder `currentUser` 驱动 `requireUser` 的登录态（登录 / 未登录）。
 * - DB 连本地真实库（docker `dodo-db`），每个用例 `beforeEach` 调 `resetDb()` 隔离。
 *
 * 各 route 测试文件顶层复用同一 session mock（`vi.mock` 需写在测试文件内，
 * 无法从外部函数注入 —— 故用返回 promise 的工厂集中鉴权逻辑）：
 *
 * ```ts
 * import { vi } from "vitest";
 * vi.mock("@/lib/auth/session", async () =>
 *   (await import("@/lib/test/route-helpers")).sessionModuleMock());
 * ```
 */

/** 可变当前用户 holder：route 测试用它驱动 requireUser 的登录态。 */
export const currentUser: { id: string } = { id: "" };

/** 设为已登录用户。 */
export function asUser(id: string): void {
  currentUser.id = id;
}

/** 设为未登录（requireUser 抛 401）。 */
export function asAnonymous(): void {
  currentUser.id = "";
}

/**
 * 供各 route 测试文件复用的 `@/lib/auth/session` 模块 mock。
 * route handler 仅用到 `requireUser`；未登录时抛与真实实现一致的 401 AppError，
 * 经 `handle()` 包装后即为 401 响应。
 */
export function sessionModuleMock() {
  return {
    requireUser: async () => {
      if (!currentUser.id) {
        throw new AppError("UNAUTHORIZED", "请先登录", 401);
      }
      return { id: currentUser.id };
    },
  };
}

/** 构造带 JSON body 的请求（route handler 只读 `.json()`）。 */
export function jsonRequest(
  body: unknown,
  init?: { method?: string },
): Request {
  return new Request("http://test/api", {
    method: init?.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** 空 body 的请求（GET/DELETE 无载荷端点）。 */
export function bareRequest(method = "GET"): Request {
  return new Request("http://test/api", { method });
}

/** `[id]` 动态段 ctx。 */
export function params(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

/** DB 清理，复用 repositories/test-helpers。 */
export async function resetDb(): Promise<void> {
  const { resetDatabase } = await import("@/lib/db/repositories/test-helpers");
  await resetDatabase();
}

/** 断开 Prisma 连接（afterEach）。 */
export async function disconnectDb(): Promise<void> {
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
}

/** 便捷建消费者用户，返回其 id。 */
export async function makeUser(email: string): Promise<{ id: string }> {
  const { create } = await import("@/lib/db/repositories/userAccount.repo");
  const user = await create({ email, authProvider: "email", role: "user" });
  return { id: user.id };
}

// --- Clinic 测试脚手架（供 clinic 路由测试复用） ---

/** clinic 测试当前上下文 holder（驱动 requireClinicUser 的鉴权态）。 */
export const currentClinic: { userId: string; clinicId: string } = {
  userId: "",
  clinicId: "",
};

/** 设为已登录诊所用户（带 clinicId）。 */
export function asClinic(userId: string, clinicId: string): void {
  currentClinic.userId = userId;
  currentClinic.clinicId = clinicId;
}

/** 便捷建 clinic 用户 + 诊所 + ClinicStaff，返回 { userId, clinicId }。 */
export async function makeClinicUser(
  email: string,
): Promise<{ userId: string; clinicId: string }> {
  const { create } = await import("@/lib/db/repositories/userAccount.repo");
  const user = await create({ email, authProvider: "email", role: "clinic" });
  const { prisma } = await import("@/lib/db/prisma");
  const clinic = await prisma.clinic.create({ data: { name: "Test Clinic" } });
  await prisma.clinicStaff.create({
    data: { clinicId: clinic.id, userId: user.id, title: "doctor" },
  });
  return { userId: user.id, clinicId: clinic.id };
}

/** 供 clinic 路由测试文件复用的 `@/lib/auth/clinic` 模块 mock。 */
export function clinicSessionMock() {
  return {
    requireClinicUser: async (): Promise<ClinicUser> => {
      if (!currentClinic.userId) {
        throw new AppError("UNAUTHORIZED", "请先登录", 401);
      }
      return {
        id: currentClinic.userId,
        clinicId: currentClinic.clinicId,
        role: "clinic",
      };
    },
  };
}
