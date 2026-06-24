import type { StudySession } from "@prisma/client";
import {
  type CaptureWindow,
  captureWindowSchema,
  type StudySessionStatus,
  studySessionStatusSchema,
  type WashoutStatus,
  washoutStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export interface CreateStudySessionInput {
  userId: string;
  startDate?: Date | null;
  questionnaireAt: Date;
  currentWeek?: number;
  status: StudySessionStatus;
  preferredCaptureWindow?: CaptureWindow | null;
  interventionSide: "left" | "right";
  controlSide: "left" | "right";
  consentAt: Date;
  washoutStatus: WashoutStatus;
  baselineAsymmetryFlag?: boolean;
}

/**
 * 状态机合法转移表（§7）
 * pending_first_capture → active → (paused ⇄ active) → completed / abandoned
 */
const TRANSITIONS: Record<StudySessionStatus, StudySessionStatus[]> = {
  pending_first_capture: ["active", "abandoned"],
  active: ["paused", "completed", "abandoned"],
  paused: ["active", "abandoned"],
  completed: [],
  abandoned: [],
};

function validateCreateInput(input: CreateStudySessionInput): void {
  studySessionStatusSchema.parse(input.status);
  washoutStatusSchema.parse(input.washoutStatus);
  if (
    input.preferredCaptureWindow !== undefined &&
    input.preferredCaptureWindow !== null
  ) {
    captureWindowSchema.parse(input.preferredCaptureWindow);
  }
}

export async function create(
  input: CreateStudySessionInput,
): Promise<StudySession> {
  validateCreateInput(input);
  return prisma.studySession.create({ data: input });
}

/**
 * 查询用户当前 active session
 * 唯一性由 DB partial unique index study_session_one_active 兜底
 * 软删除的不算 active
 */
export async function findActiveByUserId(
  userId: string,
): Promise<StudySession | null> {
  return prisma.studySession.findFirst({
    where: { userId, status: "active", deletedAt: null },
  });
}

/**
 * 状态机转移：校验合法性后更新
 * paused 写 pausedAt；paused→active 写 resumedAt
 */
export async function transitionStatus(
  id: string,
  to: StudySessionStatus,
): Promise<StudySession> {
  studySessionStatusSchema.parse(to);

  const session = await prisma.studySession.findUniqueOrThrow({
    where: { id },
  });
  const currentStatus = session.status as StudySessionStatus;
  const allowed = TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`非法状态转移：${session.status} → ${to}`);
  }

  const data: Record<string, unknown> = { status: to };
  if (to === "paused") data.pausedAt = new Date();
  if (to === "active" && session.status === "paused")
    data.resumedAt = new Date();

  return prisma.studySession.update({ where: { id }, data });
}

export async function softDelete(id: string): Promise<StudySession> {
  return prisma.studySession.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
