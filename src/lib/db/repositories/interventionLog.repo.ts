import type { InterventionLog } from "~prisma/client";
import {
  type FaceSideWithBoth,
  faceSideWithBothSchema,
  type InterventionCategory,
  interventionCategorySchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export interface CreateInterventionLogInput {
  userId: string;
  sessionId: string;
  faceSide: FaceSideWithBoth;
  productName?: string | null;
  category: InterventionCategory;
  dose?: string | null;
  regimeStartDate: Date;
  regimeEndDate?: Date | null;
  frequency?: string | null;
  note?: string | null;
}

function validateInput(input: CreateInterventionLogInput): void {
  faceSideWithBothSchema.parse(input.faceSide);
  interventionCategorySchema.parse(input.category);
}

export async function create(
  input: CreateInterventionLogInput,
): Promise<InterventionLog> {
  validateInput(input);
  return prisma.interventionLog.create({ data: input });
}

/**
 * 查询 session 当前生效的 regime
 * 红线 §12：regime_end_date IS NULL 表示当前 regime
 * Loop 3 聚合必须用 COALESCE(regime_end_date, CURRENT_DATE)——
 * 此处查询"当前生效"即 regime_end_date IS NULL
 */
export async function findActiveBySession(
  sessionId: string,
): Promise<InterventionLog[]> {
  return prisma.interventionLog.findMany({
    where: { sessionId, regimeEndDate: null },
    orderBy: { regimeStartDate: "desc" },
  });
}

/**
 * 事务：关闭旧 regime（置 regime_end_date）+ 插入新 regime
 * 用于 sis_response_log 换产品场景（§12 三类写入来源③）
 */
export async function closeRegimeAndStartNew(
  oldLogId: string,
  newLog: CreateInterventionLogInput,
): Promise<InterventionLog> {
  validateInput(newLog);

  return prisma.$transaction(async (tx) => {
    // 关闭旧 regime（findUniqueOrThrow 保证旧记录存在，否则事务回滚）
    await tx.interventionLog.findUniqueOrThrow({ where: { id: oldLogId } });
    await tx.interventionLog.update({
      where: { id: oldLogId },
      data: { regimeEndDate: new Date() },
    });

    // 插入新 regime
    return tx.interventionLog.create({ data: newLog });
  });
}
