import {
  type StudyEnrollmentStatus,
  studyEnrollmentStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { StudyEnrollment } from "~prisma/client";

export interface EnrollInput {
  studyId: string;
  userId: string;
  status: StudyEnrollmentStatus;
  arm?: string | null;
  consentGiven: boolean;
}

/** 入组 / 重入（(studyId,userId) 唯一）：consentGiven 时写 consentAt，清 withdrawnAt */
export async function enroll(input: EnrollInput): Promise<StudyEnrollment> {
  studyEnrollmentStatusSchema.parse(input.status);
  return prisma.studyEnrollment.upsert({
    where: { studyId_userId: { studyId: input.studyId, userId: input.userId } },
    create: {
      studyId: input.studyId,
      userId: input.userId,
      status: input.status,
      arm: input.arm ?? null,
      consentGiven: input.consentGiven,
      consentAt: input.consentGiven ? new Date() : null,
    },
    update: {
      status: input.status,
      arm: input.arm ?? null,
      consentGiven: input.consentGiven,
      consentAt: input.consentGiven ? new Date() : null,
      withdrawnAt: null,
    },
  });
}

/** 退出：保留记录，用 withdrawnAt 标记 + 收回同意 */
export async function withdraw(
  studyId: string,
  userId: string,
): Promise<StudyEnrollment> {
  return prisma.studyEnrollment.update({
    where: { studyId_userId: { studyId, userId } },
    data: { withdrawnAt: new Date(), consentGiven: false },
  });
}

export async function listByUser(userId: string): Promise<StudyEnrollment[]> {
  return prisma.studyEnrollment.findMany({ where: { userId } });
}
