/** 导出下载文件名：drruby-export-YYYY-MM-DD.json（date 外部传入便于测试）。 */
export function exportFileName(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `drruby-export-${y}-${m}-${d}.json`;
}
