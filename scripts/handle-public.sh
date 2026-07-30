#!/usr/bin/env bash
#
# 将 public 目录下大于 200K 的图片文件转换为 webp 格式。
#
# 用法:
#   ./scripts/handle-public.sh [目标目录]
#
# 默认处理 public 目录。需要安装 vips (https://www.libvips.org/)。
#
set -euo pipefail

# 大小阈值（字节），默认 200K
THRESHOLD=$((200 * 1024))

# webp 质量
QUALITY=80

# 目标目录，默认脚本所在仓库的 public
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$SCRIPT_DIR/../public}"

if ! command -v vips >/dev/null 2>&1; then
  echo "错误: 未找到 vips 命令，请先安装 (brew install vips)。" >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "错误: 目录不存在: $TARGET_DIR" >&2
  exit 1
fi

echo "扫描目录: $TARGET_DIR"
echo "阈值: $((THRESHOLD / 1024))K, 质量: $QUALITY"
echo

converted=0
skipped=0

# 查找常见栅格图片格式（webp 自身除外）
while IFS= read -r -d '' file; do
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
  if [ "$size" -le "$THRESHOLD" ]; then
    continue
  fi

  webp="${file%.*}.webp"
  if [ -f "$webp" ]; then
    echo "跳过 (已存在): $webp"
    skipped=$((skipped + 1))
    continue
  fi

  echo "转换: $file ($((size / 1024))K) -> $webp"
  vips webpsave "$file" "$webp" --Q "$QUALITY" --strip
  converted=$((converted + 1))
done < <(find "$TARGET_DIR" -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo
echo "完成: 转换 $converted 个, 跳过 $skipped 个。"
