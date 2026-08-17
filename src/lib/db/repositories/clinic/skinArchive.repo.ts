import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { Trend } from "@/lib/db/enums";
import { trendSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { SkinArchive } from "~prisma/client";

export interface ListSkinArchiveFilter {
  patientUserId?: string;
  trend?: Trend;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListSkinArchiveFilter = {},
): Promise<PageResult<SkinArchive>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.patientUserId) where.patientUserId = filter.patientUserId;
  if (filter.trend) {
    trendSchema.parse(filter.trend);
    where.trend = filter.trend;
  }
  return paginate<SkinArchive>(
    prisma.skinArchive,
    {
      where,
      orderBy: { capturedAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<SkinArchive | null> {
  return prisma.skinArchive.findUnique({ where: { id } });
}

export interface CreateSkinArchiveInput {
  patientUserId: string;
  objectKey: string;
  inflammatoryScore?: number | null;
  pigmentationScore?: number | null;
  textureScore?: number | null;
  trend?: Trend | null;
  capturedAt: Date;
}

export async function create(
  clinicId: string,
  input: CreateSkinArchiveInput,
): Promise<SkinArchive> {
  return prisma.skinArchive.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      objectKey: input.objectKey,
      inflammatoryScore: input.inflammatoryScore ?? null,
      pigmentationScore: input.pigmentationScore ?? null,
      textureScore: input.textureScore ?? null,
      trend: input.trend ?? null,
      capturedAt: input.capturedAt,
    },
  });
}

export async function update(
  id: string,
  patch: { trend?: Trend | null },
): Promise<SkinArchive> {
  if (patch.trend) trendSchema.parse(patch.trend);
  return prisma.skinArchive.update({
    where: { id },
    data: { trend: patch.trend },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
