#!/usr/bin/env bash
#
# 修改 Railway 远程 PostgreSQL 中某个【已注册】用户的角色（user_account.role）。
# 只改一行、不清库、不动结构。与 railway-db-seed.sh / railway-db-reset.sh 互补。
#
# 与 seed-admin 的区别:
#   - db:seed:admin 只能把账户提权为 admin，且专用于 bootstrap 第一个 admin。
#   - 本脚本可在 user / clinic / collaborator / admin 之间任意切换，直接对目标库跑 UPDATE。
#
# 用法:
#   ./scripts/railway-db-user.sh --email a@b.com --role clinic         # dev（默认，带确认）
#   ./scripts/railway-db-user.sh --email a@b.com --role admin -y       # 跳过确认（CI/自用）
#   EMAIL=a@b.com ROLE=user ./scripts/railway-db-user.sh               # 也可走环境变量
#   ./scripts/railway-db-user.sh --email a@b.com --role user -e production   # 指向生产（需键入库名确认）
#   ./scripts/railway-db-user.sh --email a@b.com --role user --database-url <url>  # 直接用给定连接串
#
# 合法角色: user | clinic | collaborator | admin
#   （见 src/lib/db/enums.ts 的 userRoleSchema；数据库 role 为 String，不是原生 enum）
#
# 依赖:
#   - Railway CLI 已登录并 railway link（除非用 --database-url 绕过）
#   - 同目录下的 railway-db.sh（用于解析 DATABASE_PUBLIC_URL）
#   - psql（PostgreSQL 客户端）
#
# 说明:
#   - 邮箱大小写不敏感匹配（lower(email)）；找不到用户则报错退出，不创建账户。
#   - 已是目标角色则跳过（幂等）。
#   - UPDATE 同时刷新 updated_at = now()，与 Prisma @updatedAt 语义保持一致。
#   - 执行前打印目标库（连接串按 user:pass 脱敏）与「当前角色 → 目标角色」，并二次确认。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICE="Postgres"
ENVIRONMENT="dev"
ASSUME_YES=0
DATABASE_URL_OVERRIDE=""
VALID_ROLES=("user" "clinic" "collaborator" "admin")

# 解析参数（--email / --role 也可用环境变量 EMAIL / ROLE 提供）
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --email)
      EMAIL="$2"; shift 2 ;;
    --role)
      ROLE="$2"; shift 2 ;;
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

# 把字符串安全地转成 SQL 字面量（单引号内、双写单引号防注入）。
# 不依赖 psql 的 :'var' 变量插值——不同版本 -c 下行为不一致（会报 syntax error at ":"）。
sql_quote() {
  printf "'%s'" "${1//\'/\'\'}"
}

# 前置校验：email / role 必填
if [ -z "${EMAIL:-}" ]; then
  echo "错误: 缺少 --email（或 EMAIL 环境变量）。" >&2
  echo "  用法: ./scripts/railway-db-user.sh --email you@example.com --role clinic" >&2
  exit 1
fi
if [ -z "${ROLE:-}" ]; then
  echo "错误: 缺少 --role（或 ROLE 环境变量）。" >&2
  echo "  合法角色: ${VALID_ROLES[*]}" >&2
  exit 1
fi

# 校验角色合法性
ROLE_OK=0
for r in "${VALID_ROLES[@]}"; do
  [ "$ROLE" = "$r" ] && ROLE_OK=1 && break
done
if [ "$ROLE_OK" -ne 1 ]; then
  echo "错误: 非法角色 '$ROLE'。合法角色: ${VALID_ROLES[*]}" >&2
  exit 1
fi

# 依赖校验：psql
if ! command -v psql >/dev/null 2>&1; then
  echo "错误: 未找到 psql，请先安装 PostgreSQL 客户端。" >&2
  echo "  brew install libpq   然后把 libpq/bin 加入 PATH" >&2
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

# 1) 查当前用户与角色（大小写不敏感）；找不到即退出
#    输出格式: id|role|status|deleted_at
EMAIL_SQL="$(sql_quote "$EMAIL")"
CURRENT="$(psql "$TARGET_URL" -Atq -c \
  "SELECT id || '|' || role || '|' || coalesce(status,'') || '|' || coalesce(deleted_at::text,'') \
   FROM user_account WHERE lower(email) = lower(${EMAIL_SQL}) LIMIT 1;")"

if [ -z "$CURRENT" ]; then
  echo "错误: 未找到 email=${EMAIL} 的用户（不会自动创建账户）。" >&2
  echo "  该邮箱须先在 /login 注册（emailOTP 或 Google）。" >&2
  exit 1
fi

USER_ID="${CURRENT%%|*}"
REST="${CURRENT#*|}"
CUR_ROLE="${REST%%|*}"
REST="${REST#*|}"
CUR_STATUS="${REST%%|*}"
CUR_DELETED="${REST#*|}"

echo
echo "==================== 即将修改用户角色 ===================="
echo "  环境      : ${ENVIRONMENT}"
echo "  服务      : ${SERVICE}"
echo "  目标库    : ${DB_HOST_PATH}"
echo "  连接串    : $(mask_url "$TARGET_URL")"
echo "  用户      : ${EMAIL} (id=${USER_ID})"
echo "  状态      : status=${CUR_STATUS:-?}${CUR_DELETED:+  ⚠️ 已软删除 deleted_at=${CUR_DELETED}}"
echo "  角色变更  : ${CUR_ROLE}  →  ${ROLE}"
echo "========================================================="
echo

# 幂等：已是目标角色则跳过
if [ "$CUR_ROLE" = "$ROLE" ]; then
  echo "✅ ${EMAIL} 已是 ${ROLE}，无需修改。"
  exit 0
fi

# 2) 生产环境守卫：键入库名 + 禁止 -y
case "$ENVIRONMENT" in
  prod|production|Production|PROD)
    echo "⚠️  目标是生产环境！这会直接改动线上用户权限。" >&2
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
      printf '确认执行以上角色变更？[y/N]: '
      read -r CONFIRM
      case "$CONFIRM" in
        y|Y|yes|YES) ;;
        *) echo "已取消。" >&2; exit 1 ;;
      esac
    fi
    ;;
esac

# 3) 执行 UPDATE（按 id 精确定位，顺带刷新 updated_at）
echo
echo "----- 执行 UPDATE -----"
ID_SQL="$(sql_quote "$USER_ID")"
ROLE_SQL="$(sql_quote "$ROLE")"
psql "$TARGET_URL" -v ON_ERROR_STOP=1 -c \
  "UPDATE user_account SET role = ${ROLE_SQL}, updated_at = now() WHERE id = ${ID_SQL};"

# 4) 回读确认
NEW_ROLE="$(psql "$TARGET_URL" -Atq -c \
  "SELECT role FROM user_account WHERE id = ${ID_SQL};")"

echo
if [ "$NEW_ROLE" = "$ROLE" ]; then
  echo "✅ 完成：${EMAIL} (id=${USER_ID}) 角色已更新为 ${NEW_ROLE}。"
else
  echo "⚠️  UPDATE 已执行，但回读到的角色为 '${NEW_ROLE}'（期望 '${ROLE}'），请人工核查。" >&2
  exit 1
fi
