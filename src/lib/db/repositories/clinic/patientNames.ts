import { prisma } from "@/lib/db/prisma";

/**
 * 轻量工具：批量把 patientUserId 投影为 name 映射。
 * clinic 各域列表/详情需展示患者名，统一在此查询，避免 repo 间强耦合。
 * 已软删的用户（deletedAt 非 null）不在结果内（映射为 undefined）。
 */
export async function patientNameMap(
  ids: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (ids.length === 0) return map;
  const rows = await prisma.userAccount.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true },
  });
  for (const r of rows) map.set(r.id, r.name);
  return map;
}
