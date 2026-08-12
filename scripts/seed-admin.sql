-- scripts/seed-admin.sql
--
-- 把已注册的普通用户提权为 admin（生产环境 bootstrap 第一个管理员）
--
-- 用途:
--   生产数据库直接执行，把某个已注册用户提权为 admin。
--   等价于 `ADMIN_EMAIL=... pnpm db:seed:admin`，但以纯 SQL 形式供 DBA 直接执行。
--
-- 用法 (psql):
--   psql "$DATABASE_URL" -v email='admin@example.com' -f scripts/seed-admin.sql
--
-- 用法 (其他 SQL 客户端如 DBeaver/DataGrip):
--   把脚本中所有 :'email' 替换为 'admin@example.com'（保留单引号），整体执行。
--
-- 前置条件:
--   - 目标邮箱须先在 /login 注册（emailOTP 或 Google），生成 user_account 行 + 关联 account 行。
--   - 不可直接 INSERT user_account 创建管理员：better-auth 的凭据存在 account 表，
--     绕过应用层注册会导致登录失败（找不到凭据）。本脚本只做 UPDATE role='admin'。
--
-- 行为:
--   - 事务包裹，出错自动 ROLLBACK。
--   - 用 lower(email) 比较（对齐 schema 中的 lower(email) 唯一索引，避免大小写问题）。
--   - 仅更新未软删（deleted_at IS NULL）且当前非 admin 的用户；已是 admin 则 noop（幂等）。
--   - 手动维护 updated_at = now()（不走 Prisma @updatedAt）。
--   - 前后各一次 SELECT 输出诊断信息，DBA 可确认提权前后状态。
--
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. 提权前诊断：确认用户存在、未软删、当前 role/status
SELECT
  id,
  email,
  role,
  status,
  deleted_at,
  created_at,
  last_login_at
FROM user_account
WHERE lower(email) = lower(:'email');

-- 2. 事务包裹提权
BEGIN;

UPDATE user_account
SET
  role = 'admin',
  updated_at = now()
WHERE lower(email) = lower(:'email')
  AND deleted_at IS NULL
  AND role <> 'admin';

-- 0 行受影响 = 用户不存在 / 已软删 / 已是 admin（看上方诊断输出判断）
-- 1 行受影响 = 提权成功

COMMIT;

-- 3. 提权后验证
SELECT
  id,
  email,
  role,
  status,
  updated_at
FROM user_account
WHERE lower(email) = lower(:'email');
