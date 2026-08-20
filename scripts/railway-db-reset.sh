#!/usr/bin/env bash
#
# 清空并重建 Railway 远程 PostgreSQL 数据库（drop 全部表 → 重放全部迁移）。
#
# 用途:
#   当本地 prisma/migrations 与线上库不一致、且线上数据可丢弃时，
#   用本脚本把远程库重置为「与本地迁移完全一致」的干净状态。
#   本质是对着远程库跑 `prisma migrate reset`。
#
# 用法:
#   ./scripts/railway-db-reset.sh                       # 重置 dev 环境（默认，带二次确认）
#   ./scripts/railway-db-reset.sh --seed                # 重置后跑 db:seed
#   ./scripts/railway-db-reset.sh --seed --seed-admin   # 重置后跑 seed + 管理员 seed
#   ./scripts/railway-db-reset.sh -e production         # 指向生产（需额外键入库名确认）
#   ./scripts/railway-db-reset.sh -y                    # 跳过交互确认（谨慎，CI 用）
#   ./scripts/railway-db-reset.sh --database-url <url>  # 直接用给定连接串，不走 railway
#
# 依赖:
#   - Railway CLI 已登录并 `railway link`（除非用 --database-url 绕过）
#   - 同目录下的 railway-db.sh（用于解析 DATABASE_PUBLIC_URL）
#   - pnpm / prisma
#
# 安全设计:
#   - 默认环境为 dev；指向 production 时强制要求键入库名二次确认。
#   - 执行前打印目标库名（连接串按 user:pass 脱敏），并要求键入 RESET 确认。
#   - `--database-url` 与 railway 解析互斥，方便临时指向任意库。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SERVICE="Postgres"
ENVIRONMENT="dev"
RUN_SEED=0
RUN_SEED_ADMIN=0
ASSUME_YES=0
DATABASE_URL_OVERRIDE=""

# 解析参数
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --seed)
      RUN_SEED=1; shift ;;
    --seed-admin)
      RUN_SEED_ADMIN=1; shift ;;
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

# 前置校验：--seed-admin 依赖 ADMIN_EMAIL，且该账户须已在 /login 注册。
# 在任何破坏性操作之前就拦截，避免 drop/seed 跑完才在最后一步失败。
if [ "$RUN_SEED_ADMIN" -eq 1 ] && [ -z "${ADMIN_EMAIL:-}" ]; then
  echo "错误: --seed-admin 需要 ADMIN_EMAIL 环境变量。" >&2
  echo "  用法: ADMIN_EMAIL=you@example.com ./scripts/railway-db-reset.sh --seed --seed-admin" >&2
  echo "  注意: seed-admin 只把【已注册】账户提权为 admin，不会创建账户；" >&2
  echo "        该邮箱须先在 /login 注册，否则会因『未找到用户』失败。" >&2
  exit 1
fi

# 1) 解析目标数据库连接串
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

# 从连接串里抠出「主机/库名」用于展示与确认
DB_HOST_PATH="$(echo "$TARGET_URL" | sed -E 's#^[^:]+://[^@]*@##; s#\?.*$##')"

echo
echo "==================== 即将重置数据库 ===================="
echo "  环境    : ${ENVIRONMENT}"
echo "  服务    : ${SERVICE}"
echo "  目标库  : ${DB_HOST_PATH}"
echo "  连接串  : $(mask_url "$TARGET_URL")"
echo "  动作    : prisma migrate reset（drop 全部表 → 重放迁移）"
[ "$RUN_SEED" -eq 1 ] && echo "  之后    : pnpm db:seed"
[ "$RUN_SEED_ADMIN" -eq 1 ] && echo "  之后    : pnpm db:seed:admin"
echo "========================================================"
echo

# 2) 生产环境额外守卫：必须键入完整 host/库名
case "$ENVIRONMENT" in
  prod|production|Production|PROD)
    echo "⚠️  目标是生产环境！此操作会清空所有数据且不可恢复。" >&2
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
esac

# 3) 常规二次确认（键入 RESET）
if [ "$ASSUME_YES" -ne 1 ]; then
  printf '确认清空并重建该库？键入 RESET 继续: '
  read -r CONFIRM
  if [ "$CONFIRM" != "RESET" ]; then
    echo "已取消。" >&2
    exit 1
  fi
fi

cd "$REPO_DIR"

# 4) 先打印一次迁移状态（信息用途，失败不阻断）
echo
echo "----- 当前迁移状态（重置前）-----"
DATABASE_URL="$TARGET_URL" pnpm db:migrate:status || true

# 5) 执行 reset（--force 跳过 prisma 自带交互，确认已由本脚本完成）
#    Prisma 7 的 reset 无 --skip-seed；因 prisma.config 未配 migrations.seed，
#    reset 本就不自动灌种子，种子统一由本脚本的 --seed 显式触发。
echo
echo "----- 执行 prisma migrate reset -----"
DATABASE_URL="$TARGET_URL" pnpm prisma migrate reset --force

# 6) 按需种子
if [ "$RUN_SEED" -eq 1 ]; then
  echo
  echo "----- 执行 db:seed -----"
  DATABASE_URL="$TARGET_URL" pnpm db:seed
fi
if [ "$RUN_SEED_ADMIN" -eq 1 ]; then
  echo
  echo "----- 执行 db:seed:admin (ADMIN_EMAIL=${ADMIN_EMAIL}) -----"
  echo "提示: 仅提权【已注册】账户；若该邮箱尚未在 /login 注册会失败。" >&2
  DATABASE_URL="$TARGET_URL" ADMIN_EMAIL="$ADMIN_EMAIL" pnpm db:seed:admin
fi

echo
echo "✅ 完成：${DB_HOST_PATH} 已重置为与本地迁移一致。"
