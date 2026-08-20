#!/usr/bin/env bash
#
# 对 Railway 远程 PostgreSQL 执行种子（db:seed）与/或管理员提权（db:seed:admin）。
# 不清库、不动结构，仅灌数据 / 改角色。与 railway-db-reset.sh 互补。
#
# 用法:
#   ./scripts/railway-db-seed.sh                                  # 只跑 db:seed（dev）
#   ./scripts/railway-db-seed.sh --admin --admin-email kissjing4003@163.com    # 跑 seed + 提权
#   ./scripts/railway-db-seed.sh --admin-only --admin-email a@b.com  # 只提权，不跑 seed
#   ./scripts/railway-db-seed.sh --no-seed --admin --admin-email a@b.com  # 同上（组合写法）
#   ./scripts/railway-db-seed.sh --no-seed                        # 跳过 seed（未加 --admin 则无动作，报错）
#   ADMIN_EMAIL=a@b.com ./scripts/railway-db-seed.sh --admin      # 邮箱也可走环境变量
#   ./scripts/railway-db-seed.sh -e production ...                # 指向生产（需键入库名确认）
#   ./scripts/railway-db-seed.sh --database-url <url> ...         # 直接用给定连接串
#
# 依赖:
#   - Railway CLI 已登录并 railway link（除非用 --database-url 绕过）
#   - 同目录下的 railway-db.sh（解析 DATABASE_PUBLIC_URL）
#   - pnpm / prisma / tsx
#
# 说明:
#   - db:seed（prisma/seed.ts）：灌业务种子数据。
#   - db:seed:admin（prisma/seed-admin.ts）：把【已注册】账户提权为 admin，
#     不创建账户 —— 该邮箱须先在 /login 注册，否则报『未找到用户』。
#   - --admin/--admin-only 均要求 ADMIN_EMAIL（--admin-email 或环境变量）。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SERVICE="Postgres"
ENVIRONMENT="dev"
RUN_SEED=1
RUN_ADMIN=0
ASSUME_YES=0
DATABASE_URL_OVERRIDE=""

# 解析参数
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --admin)
      RUN_ADMIN=1; shift ;;
    --admin-only)
      RUN_ADMIN=1; RUN_SEED=0; shift ;;
    --no-seed)
      RUN_SEED=0; shift ;;
    --admin-email)
      ADMIN_EMAIL="$2"; shift 2 ;;
    -y|--yes)
      ASSUME_YES=1; shift ;;
    --database-url)
      DATABASE_URL_OVERRIDE="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "${BASH_SOURCE[0]}" | sed 's/^#\s\?//'; exit 0 ;;
    -*)
      echo "错误: 未知参数: $1" >&2; exit 1 ;;
    *)
      echo "错误: 多余参数: $1" >&2; exit 1 ;;
  esac
done

# 脱敏：把 scheme://user:pass@ 中的凭证隐藏
mask_url() {
  echo "$1" | sed -E 's#(://)[^:@/]+(:[^@/]+)?@#\1****:****@#'
}

# 前置校验：提权需要 ADMIN_EMAIL，先拦截再执行
if [ "$RUN_ADMIN" -eq 1 ] && [ -z "${ADMIN_EMAIL:-}" ]; then
  echo "错误: --admin/--admin-only 需要 ADMIN_EMAIL（--admin-email 或环境变量）。" >&2
  echo "  用法: ./scripts/railway-db-seed.sh --admin --admin-email you@example.com" >&2
  echo "  注意: seed-admin 只提权【已注册】账户，不创建账户；该邮箱须先在 /login 注册。" >&2
  exit 1
fi

# 没有任何动作可做（如只给了 --no-seed 却没 --admin）
if [ "$RUN_SEED" -eq 0 ] && [ "$RUN_ADMIN" -eq 0 ]; then
  echo "错误: 没有要执行的动作（--no-seed 需配合 --admin）。" >&2
  exit 1
fi

# 解析目标数据库连接串
if [ -n "$DATABASE_URL_OVERRIDE" ]; then
  TARGET_URL="$DATABASE_URL_OVERRIDE"
  echo "使用 --database-url 指定的连接串（不走 railway）。"
else
  echo "通过 railway 解析 $SERVICE ($ENVIRONMENT) 的 DATABASE_PUBLIC_URL..." >&2
  TARGET_URL="$("${SCRIPT_DIR}/railway-db.sh" --service "$SERVICE" --environment "$ENVIRONMENT" --url)"
fi

if [ -z "${TARGET_URL:-}" ]; then
  echo "错误: 未能解析到 DATABASE_URL。" >&2
  exit 1
fi

DB_HOST_PATH="$(echo "$TARGET_URL" | sed -E 's#^[^:]+://[^@]*@##; s#\?.*$##')"

echo
echo "==================== 即将写入种子数据 ===================="
echo "  环境    : ${ENVIRONMENT}"
echo "  服务    : ${SERVICE}"
echo "  目标库  : ${DB_HOST_PATH}"
echo "  连接串  : $(mask_url "$TARGET_URL")"
[ "$RUN_SEED" -eq 1 ]  && echo "  动作    : pnpm db:seed"
[ "$RUN_ADMIN" -eq 1 ] && echo "  动作    : pnpm db:seed:admin (ADMIN_EMAIL=${ADMIN_EMAIL})"
echo "=========================================================="
echo

# 生产环境守卫：键入库名 + 禁止 -y
case "$ENVIRONMENT" in
  prod|production|Production|PROD)
    echo "⚠️  目标是生产环境！seed 可能覆盖既有数据。" >&2
    if [ "$ASSUME_YES" -eq 1 ]; then
      echo "错误: 生产环境禁止使用 -y/--yes 跳过确认。" >&2
      exit 1
    fi
    printf '请键入目标库标识以确认 [%s]: ' "$DB_HOST_PATH"
    read -r CONFIRM_DB
    if [ "$CONFIRM_DB" != "$DB_HOST_PATH" ]; then
      echo "已取消：输入与目标库不匹配。" >&2
      exit 1
    fi
    ;;
  *)
    if [ "$ASSUME_YES" -ne 1 ]; then
      printf '确认对以上目标库执行？[y/N]: '
      read -r CONFIRM
      case "$CONFIRM" in
        y|Y|yes|YES) ;;
        *) echo "已取消。" >&2; exit 1 ;;
      esac
    fi
    ;;
esac

cd "$REPO_DIR"

if [ "$RUN_SEED" -eq 1 ]; then
  echo
  echo "----- 执行 db:seed -----"
  DATABASE_URL="$TARGET_URL" pnpm db:seed
fi

if [ "$RUN_ADMIN" -eq 1 ]; then
  echo
  echo "----- 执行 db:seed:admin (ADMIN_EMAIL=${ADMIN_EMAIL}) -----"
  echo "提示: 仅提权【已注册】账户；若该邮箱尚未在 /login 注册会失败。" >&2
  DATABASE_URL="$TARGET_URL" ADMIN_EMAIL="$ADMIN_EMAIL" pnpm db:seed:admin
fi

echo
echo "✅ 完成。"
