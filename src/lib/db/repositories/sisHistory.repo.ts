import type { SisHistory } from "~prisma/client";
import {
  type McsLevel,
  mcsLevelSchema,
  type SisStatus,
  sisStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export interface UpsertSisHistoryInput {
  userId: string;
  sessionId: string;
  studyWeek: number;
  sisIntervention?: number | null;
  sisControl?: number | null;
  /** 可选：调用方可显式传入，未传则由 computeDelta 派生 */
  sisDelta?: number | null;
  mcsLowest?: McsLevel | null;
  captureCount?: number | null;
  status: SisStatus;
  computedAt?: Date | null;
}

function validateInput(input: UpsertSisHistoryInput): void {
  sisStatusSchema.parse(input.status);
  if (input.mcsLowest !== undefined && input.mcsLowest !== null) {
    mcsLevelSchema.parse(input.mcsLowest);
  }
}

/**
 * 🔴 sis_delta = sis_intervention − sis_control
 * 正=有效 / 零=无效 / 负=刺激
 * 任一为 null 时返回 null
 */
export function computeDelta(
  sisIntervention: number | null,
  sisControl: number | null,
): number | null {
  if (sisIntervention === null || sisControl === null) return null;
  return Number((sisIntervention - sisControl).toFixed(6));
}

/**
 * 漏采降级规则（§11）：
 * 2 次 → computed
 * 1 次 → degraded（mcs_lowest 上限 Medium）
 * 0 次 → skipped（不入趋势，不生成 insight）
 */
export function degradeByCaptureCount(captureCount: number | null): SisStatus {
  if (captureCount === null || captureCount === 0) return "skipped";
  if (captureCount === 1) return "degraded";
  return "computed";
}

/**
 * UPSERT：每 session 每周一条 SIS（@@unique([sessionId, studyWeek])）
 * sisDelta 若调用方未显式传入，则由 computeDelta 派生
 */
export async function upsert(
  input: UpsertSisHistoryInput,
): Promise<SisHistory> {
  validateInput(input);

  const sisDelta =
    input.sisDelta !== undefined
      ? input.sisDelta
      : computeDelta(input.sisIntervention ?? null, input.sisControl ?? null);

  return prisma.sisHistory.upsert({
    where: {
      sessionId_studyWeek: {
        sessionId: input.sessionId,
        studyWeek: input.studyWeek,
      },
    },
    create: { ...input, sisDelta },
    update: { ...input, sisDelta },
  });
}

export async function findBySessionAndWeek(
  sessionId: string,
  studyWeek: number,
): Promise<SisHistory | null> {
  return prisma.sisHistory.findUnique({
    where: {
      sessionId_studyWeek: { sessionId, studyWeek },
    },
  });
}
