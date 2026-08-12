/**
 * Bootstrap 第一个 admin 用户
 *
 * 运行：
 *   ADMIN_EMAIL=you@example.com pnpm db:seed:admin
 *   或 ADMIN_EMAIL=you@example.com tsx scripts/seed-admin.ts
 *
 * 说明：
 * - 读 ADMIN_EMAIL 环境变量；缺失则报错退出（exit 1）。
 * - userAccountRepo.findByEmail 命中则 update(role:"admin")；未命中则报错退出（不自动创建账户，避免误造）。
 * - 已是 admin 则跳过，幂等可重复运行。
 * - 仅用于 bootstrap 第一个 admin；后续 admin 角色变更走 /admin/users 后台。
 *
 * 前置：目标邮箱须先在 /login 注册账户（emailOTP 或 Google）。
 */
import "dotenv/config";
import { userAccountRepo } from "@/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("[seed-admin] 缺少 ADMIN_EMAIL 环境变量");
    console.error(
      "[seed-admin] 用法：ADMIN_EMAIL=you@example.com pnpm db:seed:admin",
    );
    process.exit(1);
  }

  const user = await userAccountRepo.findByEmail(email);
  if (!user) {
    console.error(
      `[seed-admin] 未找到 email=${email} 的用户，请先在 /login 注册该账户`,
    );
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`[seed-admin] ${email} (id=${user.id}) 已是 admin，跳过`);
    return;
  }

  await userAccountRepo.update(user.id, { role: "admin" });
  console.log(`[seed-admin] ${email} (id=${user.id}) 已提权为 admin`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-admin] 失败:", err);
    process.exit(1);
  });
