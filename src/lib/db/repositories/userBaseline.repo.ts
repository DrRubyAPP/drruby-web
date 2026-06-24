import type { UserBaseline } from "@prisma/client";
import { type HormonalStatus, hormonalStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export interface UpsertUserBaselineInput {
  skinType?: string | null;
  fitzpatrickScale?: string | null;
  hormonalStatus?: HormonalStatus | null;
  menopauseYear?: number | null;
  concernGoals?: string[];
}

function validateInput(input: UpsertUserBaselineInput): void {
  if (input.hormonalStatus !== undefined && input.hormonalStatus !== null) {
    hormonalStatusSchema.parse(input.hormonalStatus);
  }
}

/**
 * 1:1 UPSERT：每用户一行基线档案
 * 用 userId 作唯一键 upsert，重复调用更新而非新建
 */
export async function upsert(
  userId: string,
  input: UpsertUserBaselineInput,
): Promise<UserBaseline> {
  validateInput(input);
  return prisma.userBaseline.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}

export async function findByUserId(
  userId: string,
): Promise<UserBaseline | null> {
  return prisma.userBaseline.findUnique({ where: { userId } });
}
