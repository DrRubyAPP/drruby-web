import {
  type StudyRecruitmentStatus,
  studyRecruitmentStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { ResearchStudy } from "~prisma/client";

export interface CreateResearchStudyInput {
  name: string;
  description?: string | null;
  irbNumber?: string | null;
  recruitmentStatus: StudyRecruitmentStatus;
  fields?: string[];
}

export async function create(
  input: CreateResearchStudyInput,
): Promise<ResearchStudy> {
  studyRecruitmentStatusSchema.parse(input.recruitmentStatus);
  return prisma.researchStudy.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      irbNumber: input.irbNumber ?? null,
      recruitmentStatus: input.recruitmentStatus,
      fields: input.fields ?? [],
    },
  });
}

/** 全局目录，招募中在前 */
export async function list(): Promise<ResearchStudy[]> {
  return prisma.researchStudy.findMany({ orderBy: { createdAt: "desc" } });
}

export async function findById(id: string): Promise<ResearchStudy | null> {
  return prisma.researchStudy.findUnique({ where: { id } });
}
