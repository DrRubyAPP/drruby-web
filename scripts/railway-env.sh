#!/usr/bin/env bash
#
# 从 env 文件批量写入 Railway 环境变量。
#
# 用法:
#   ./scripts/railway-env.sh                              # 默认: .env.dev → dev 环境
#   ./scripts/railway-env.sh -e production                # 自动选 .env → production 环境
#   ./scripts/railway-env.sh -e production --yes          # 跳过生产确认
#   ./scripts/railway-env.sh /path/to/.env.custom         # 自定义 env 文件（仍走 dev）
#   ./scripts/railway-env.sh -e production /path/to/.env  # 自定义 env 文件 + 生产环境
#   ./scripts/railway-env.sh -s <服务> -e <环境> [env 文件] [--dry-run] [--yes]
#   ./scripts/railway-env.sh --dry-run                    # 仅打印，不实际写入
#   ./scripts/railway-env.sh -h|--help                    # 查看帮助
#
# 默认读取仓库根目录的 .env.dev 文件并推送到 dev 环境。
# 传 -e production（或 prod/PROD）时，若未显式指定 env 文件，自动改读 .env。
#
# 需要先安装并登录 Railway CLI:
#   pnpm dlx @railway/cli login   (或 brew install railway)
#   railway link                  (关联当前目录到某个项目)
#
# 说明:
#   - env 文件每行格式为 KEY=VALUE，支持 `export KEY=VALUE`。
#   - 以 # 开头的行和空行会被忽略。
#   - 值两侧的成对引号（单/双）会被去除。
#   - 推送到 production 环境会要求确认（--yes 跳过）。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE="drruby-web"
## 默认开发环境
ENVIRONMENT="dev"
## env 文件路径；空表示按 ENVIRONMENT 自动推断
ENV_FILE=""
DRY_RUN=0
ASSUME_YES=0

# 解析参数
while [ $# -gt 0 ]; do
  case "$1" in
    -s|--service)
      SERVICE="$2"; shift 2 ;;
    -e|--environment)
      ENVIRONMENT="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -y|--yes)
      ASSUME_YES=1; shift ;;
    -h|--help)
      grep '^#' "${BASH_SOURCE[0]}" | sed 's/^#\s\?//'; exit 0 ;;
    -*)
      echo "错误: 未知参数: $1" >&2; exit 1 ;;
    *)
      ENV_FILE="$1"; shift ;;
  esac
done

# 未显式指定 env 文件时，按 ENVIRONMENT 自动推断
if [ -z "$ENV_FILE" ]; then
  case "$ENVIRONMENT" in
    dev)
      ENV_FILE="$ROOT_DIR/.env.dev" ;;
    prod|production|Production|PROD)
      ENV_FILE="$ROOT_DIR/.env" ;;
    *)
      ENV_FILE="$ROOT_DIR/.env.$ENVIRONMENT" ;;
  esac
fi

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

# 不推送的变量：Railway 端用跨 Service 引用语法注入，硬推字符串会覆盖引用导致连库失败。
# DATABASE_URL 在 Railway UI 里配成 ${{Postgres.DATABASE_URL}}，由 Postgres 服务自动解析。
SKIP_KEYS=("DATABASE_URL")

# 收集所有 --set 参数，一次性写入以减少部署触发次数
SET_ARGS=()
count=0
skipped=0

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

  # 检查是否在跳过列表
  is_skipped=0
  for skip_key in "${SKIP_KEYS[@]}"; do
    if [ "$key" = "$skip_key" ]; then
      is_skipped=1
      break
    fi
  done
  if [ "$is_skipped" -eq 1 ]; then
    echo "  $key (跳过: Railway 端用引用注入)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  $key"
  SET_ARGS+=(--set "$key=$value")
  count=$((count + 1))
done < "$ENV_FILE"

echo
if [ "$count" -eq 0 ]; then
  echo "没有可写入的变量。"
  [ "$skipped" -gt 0 ] && echo "（跳过 $skipped 个由 Railway 端引用注入的变量）"
  exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run: 将写入 $count 个变量，未执行。"
  [ "$skipped" -gt 0 ] && echo "（跳过 $skipped 个由 Railway 端引用注入的变量）"
  exit 0
fi

# 生产环境守卫
case "$ENVIRONMENT" in
  prod|production|Production|PROD)
    if [ "$ASSUME_YES" -ne 1 ]; then
      echo "⚠️  目标是生产环境 ($ENVIRONMENT)，将写入 $count 个变量并触发 redeploy。" >&2
      printf '确认推送？[y/N]: '
      read -r CONFIRM
      case "$CONFIRM" in
        y|Y|yes|YES) ;;
        *) echo "已取消。" >&2; exit 1 ;;
      esac
    fi
    ;;
esac

echo "写入 $count 个变量到 Railway..."
railway variables "${RAILWAY_ARGS[@]}" "${SET_ARGS[@]}"

echo
echo "✅ 完成。"
