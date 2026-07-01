#!/usr/bin/env bash
#
# 从 env 文件批量写入 Railway 环境变量。
#
# 用法:
#   ./scripts/railway-env.sh [env 文件] [-s|--service <服务>] [-e|--environment <环境>] [--dry-run]
#
# 默认读取仓库根目录的 .env.production 文件。
# 需要先安装并登录 Railway CLI:
#   pnpm dlx @railway/cli login   (或 brew install railway)
#   railway link                  (关联当前目录到某个项目)
#
# 说明:
#   - env 文件每行格式为 KEY=VALUE，支持 `export KEY=VALUE`。
#   - 以 # 开头的行和空行会被忽略。
#   - 值两侧的成对引号（单/双）会被去除。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="$ROOT_DIR/.env.dev"
SERVICE="drruby-web"
## 默认开发环境
ENVIRONMENT="dev"
DRY_RUN=0

# 解析参数
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      grep '^#' "${BASH_SOURCE[0]}" | sed 's/^#\s\?//'; exit 0 ;;
    -*)
      echo "错误: 未知参数: $1" >&2; exit 1 ;;
    *)
      ENV_FILE="$1"; shift ;;
  esac
done

if ! command -v railway >/dev/null 2>&1; then
  echo "错误: 未找到 railway 命令，请先安装 Railway CLI。" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "错误: env 文件不存在: $ENV_FILE" >&2
  exit 1
fi

# 组装 railway 通用参数（service / environment 可选）
RAILWAY_ARGS=()
[ -n "$SERVICE" ] && RAILWAY_ARGS+=(--service "$SERVICE")
[ -n "$ENVIRONMENT" ] && RAILWAY_ARGS+=(--environment "$ENVIRONMENT")

echo "读取文件: $ENV_FILE"
[ -n "$SERVICE" ] && echo "服务: $SERVICE"
[ -n "$ENVIRONMENT" ] && echo "环境: $ENVIRONMENT"
[ "$DRY_RUN" -eq 1 ] && echo "(dry-run: 仅打印，不实际写入)"
echo

# 收集所有 --set 参数，一次性写入以减少部署触发次数
SET_ARGS=()
count=0

while IFS= read -r line || [ -n "$line" ]; do
  # 去掉行首尾空白
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"

  # 跳过空行与注释
  [ -z "$line" ] && continue
  case "$line" in \#*) continue ;; esac

  # 去掉可选的 export 前缀
  line="${line#export }"

  # 必须包含 =
  case "$line" in *=*) ;; *) continue ;; esac

  key="${line%%=*}"
  value="${line#*=}"

  # 去掉 key 尾部空白
  key="${key%"${key##*[![:space:]]}"}"

  # 去掉 value 两侧成对引号
  if [ ${#value} -ge 2 ]; then
    first="${value:0:1}"
    last="${value: -1}"
    if { [ "$first" = '"' ] && [ "$last" = '"' ]; } || \
       { [ "$first" = "'" ] && [ "$last" = "'" ]; }; then
      value="${value:1:${#value}-2}"
    fi
  fi

  [ -z "$key" ] && continue

  echo "  $key"
  SET_ARGS+=(--set "$key=$value")
  count=$((count + 1))
done < "$ENV_FILE"

echo
if [ "$count" -eq 0 ]; then
  echo "没有可写入的变量。"
  exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: 将写入 $count 个变量，未执行。"
  exit 0
fi

echo "写入 $count 个变量到 Railway..."
railway variables "${RAILWAY_ARGS[@]}" "${SET_ARGS[@]}"

echo
echo "完成。"
