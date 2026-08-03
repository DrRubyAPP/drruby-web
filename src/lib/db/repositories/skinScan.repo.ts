import { prisma } from "@/lib/db/prisma";
import type { Prisma, SkinScan } from "~prisma/client";

/** 单个区域评估（对齐 App SkinScanResult.zones） */
export interface SkinScanZone {
  name: string;
  status: string;
}

export interface CreateSkinScanInput {
  scannedAt: Date;
  headline: string;
  zones: SkinScanZone[];
}

export async function create(
  userId: string,
  input: CreateSkinScanInput,
): Promise<SkinScan> {
  return prisma.skinScan.create({
    data: {
      userId,
      scannedAt: input.scannedAt,
      headline: input.headline,
      zones: input.zones as unknown as Prisma.InputJsonValue,
    },
  });
}

/** 取最近一次扫描（scannedAt 最新） */
export async function findLatest(userId: string): Promise<SkinScan | null> {
  return prisma.skinScan.findFirst({
    where: { userId },
    orderBy: { scannedAt: "desc" },
  });
}
