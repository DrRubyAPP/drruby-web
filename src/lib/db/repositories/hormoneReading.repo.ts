import { prisma } from "@/lib/db/prisma";
import type { HormoneReading } from "~prisma/client";

export interface CreateHormoneReadingInput {
  marker: string;
  value: string;
  phase: string;
  note?: string | null;
  measuredAt?: Date | null;
}

export async function create(
  userId: string,
  input: CreateHormoneReadingInput,
): Promise<HormoneReading> {
  return prisma.hormoneReading.create({ data: { userId, ...input } });
}

/** 按用户列出，最新读数在前 */
export async function listByUser(userId: string): Promise<HormoneReading[]> {
  return prisma.hormoneReading.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
  });
}

export async function findById(id: string): Promise<HormoneReading | null> {
  return prisma.hormoneReading.findUnique({ where: { id } });
}
