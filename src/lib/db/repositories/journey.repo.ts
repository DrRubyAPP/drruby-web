import {
  type DecisionType,
  decisionTypeSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Journey, Prisma } from "~prisma/client";

export interface ListJourneyFilter {
  decisionType?: DecisionType;
}

/** Library 列表：只暴露已共享且未撤回的 journey，最近更新在前 */
export async function list(filter: ListJourneyFilter = {}): Promise<Journey[]> {
  if (filter.decisionType !== undefined) {
    decisionTypeSchema.parse(filter.decisionType);
  }
  const where: Prisma.JourneyWhereInput = {
    shared: true,
    withdrawnAt: null,
  };
  if (filter.decisionType !== undefined) {
    where.decisionType = filter.decisionType;
  }
  return prisma.journey.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

/** 详情：含 living journey 的版本更新（version 正序） */
export async function findByIdWithUpdates(id: string) {
  return prisma.journey.findUnique({
    where: { id },
    include: { updates: { orderBy: { version: "asc" } } },
  });
}
