#!/usr/bin/env bash
#
# 通过 Railway 登录（连接）远程 PostgreSQL 数据库。
#
# 用法:
#   ./scripts/railway-db.sh [-s|--service <数据库服务>] [-e|--environment <环境>]
#   ./scripts/railway-db.sh --url                      # 仅打印公网连接串，不进入 shell
#   ./scripts/railway-db.sh -- <psql 参数...>          # 透传参数给 psql，如 -c "select 1"
#
# 默认连接名为 "Postgres" 的数据库服务、"dev" 环境。
# 需要先安装并登录 Railway CLI，并把当前目录关联到项目:
#   pnpm dlx @railway/cli login   (或 brew install railway)
#   railway link                  (关联当前目录到某个项目)
#
# 说明:
#   - 默认走 `railway connect`：自动建立到远程数据库的代理并打开 psql 交互 shell，
#     无需本机能直连 Railway 内网地址。
#   - `--url` 通过 `railway variables` 读取该服务的 DATABASE_PUBLIC_URL（公网连接串），
#     可配合外部工具（DBeaver / TablePlus / psql）使用。
#   - `--` 之后的参数原样透传给 psql。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICE="Postgres"
## 默认开发环境
ENVIRONMENT="dev"
PRINT_URL=0
PSQL_ARGS=()

# 解析参数
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --url)
      PRINT_URL=1; shift ;;
    -h|--help)
      grep '^#' "${BASH_SOURCE[0]}" | sed 's/^#\s\?//'; exit 0 ;;
    --)
      shift; PSQL_ARGS=("$@"); break ;;
    -*)
      echo "错误: 未知参数: $1" >&2; exit 1 ;;
    *)
      SERVICE="$1"; shift ;;
  esac
done

if ! command -v railway >/dev/null 2>&1; then
  echo "错误: 未找到 railway 命令，请先安装 Railway CLI。" >&2
  echo "  brew install railway   或   pnpm dlx @railway/cli login" >&2
  exit 1
fi

# 校验是否已登录
if ! railway whoami >/dev/null 2>&1; then
  echo "错误: 尚未登录 Railway，请先执行: railway login" >&2
  exit 1
fi

# 组装 railway 通用参数
RAILWAY_ARGS=()
[ -n "$SERVICE" ] && RAILWAY_ARGS+=(--service "$SERVICE")
[ -n "$ENVIRONMENT" ] && RAILWAY_ARGS+=(--environment "$ENVIRONMENT")

# --url: 仅打印公网连接串
if [ "$PRINT_URL" -eq 1 ]; then
  echo "读取 $SERVICE ($ENVIRONMENT) 的 DATABASE_PUBLIC_URL..." >&2
  railway variables "${RAILWAY_ARGS[@]}" --kv \
    | grep -E '^DATABASE_PUBLIC_URL=' \
    | head -n1 \
    | sed 's/^DATABASE_PUBLIC_URL=//'
  exit 0
fi

echo "连接数据库服务: $SERVICE"
echo "环境: $ENVIRONMENT"
echo "(通过 railway connect 建立代理并打开 psql，Ctrl-D 退出)"
echo

# railway connect 会自动建立代理并打开 psql 交互 shell。
# 若透传了 psql 参数，则改用 railway run + psql，注入服务环境变量后执行。
if [ ${#PSQL_ARGS[@]} -gt 0 ]; then
  railway run "${RAILWAY_ARGS[@]}" -- psql "${PSQL_ARGS[@]}"
else
  railway connect "$SERVICE" --environment "$ENVIRONMENT"
fi
