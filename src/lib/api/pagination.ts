export interface PageParams {
  page: number;
  pageSize: number;
}

/** 从 query 解析分页参数，越界/非法值钳制为合法默认（page≥1, pageSize 1..100）。 */
export function parsePageParams(sp: URLSearchParams): PageParams {
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  return { page, pageSize };
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface PageableModel {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  count: (args: Record<string, unknown>) => Promise<number>;
}

/**
 * 基于 Prisma model delegate 的 offset 分页：并行取当前页 + 总数。
 * 用法：await paginate(prisma.appointment, { where, orderBy }, pp)
 */
export async function paginate<T = unknown>(
  model: PageableModel,
  args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> },
  pp: PageParams,
): Promise<PageResult<T>> {
  const where = args.where ?? {};
  const [items, total] = await Promise.all([
    model.findMany({
      where,
      orderBy: args.orderBy ?? { createdAt: "desc" },
      skip: (pp.page - 1) * pp.pageSize,
      take: pp.pageSize,
    }),
    model.count({ where }),
  ]);
  return {
    items: items as T[],
    total,
    page: pp.page,
    pageSize: pp.pageSize,
  };
}
