import { prisma } from "@/lib/db/prisma";
import type { HealthSource, Prisma } from "~prisma/client";

export type HealthSourceWithRecord = Prisma.HealthSourceGetPayload<{
  include: { record: true };
}>;

export interface CreateHealthSourceInput {
  fileName: string;
  mime?: string | null;
  hash?: string | null;
  objectKey?: string | null;
  storageLifecycle?: string | null;
  provenance?: Prisma.InputJsonValue | null;
}

/**
 * 创建 HealthSource 原件（Contract §12 Source 层）
 * V1 占位存储：objectKey 为本地路径/字符串，S3/R2/GCS 延后（O3）
 */
export async function create(
  userId: string,
  input: CreateHealthSourceInput,
): Promise<HealthSource> {
  return prisma.healthSource.create({
    data: {
      userId,
      fileName: input.fileName,
      mime: input.mime ?? null,
      hash: input.hash ?? null,
      objectKey: input.objectKey ?? null,
      storageLifecycle: input.storageLifecycle ?? null,
      provenance: input.provenance ?? undefined,
    },
  });
}

/** 按 uploadedAt 倒序列出某用户的原件 */
export async function listByUser(userId: string): Promise<HealthSource[]> {
  return prisma.healthSource.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

/** 单个原件（含 1:1 record 关联） */
export async function findById(
  id: string,
): Promise<HealthSourceWithRecord | null> {
  return prisma.healthSource.findUnique({
    where: { id },
    include: { record: true },
  });
}
