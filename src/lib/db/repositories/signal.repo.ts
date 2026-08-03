import {
  type SignalConfidence,
  type SignalTrend,
  signalConfidenceSchema,
  signalTrendSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Signal } from "~prisma/client";

export interface CreateSignalInput {
  label: string;
  value: string;
  unit?: string | null;
  source: string;
  confidence: SignalConfidence;
  trend?: SignalTrend | null;
  measuredAt: Date;
}

function validateInput(input: CreateSignalInput): void {
  signalConfidenceSchema.parse(input.confidence);
  if (input.trend !== undefined && input.trend !== null) {
    signalTrendSchema.parse(input.trend);
  }
}

export async function create(
  userId: string,
  input: CreateSignalInput,
): Promise<Signal> {
  validateInput(input);
  return prisma.signal.create({ data: { userId, ...input } });
}

/** 按用户列出，最新在前 */
export async function listByUser(userId: string): Promise<Signal[]> {
  return prisma.signal.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
  });
}

export async function findById(id: string): Promise<Signal | null> {
  return prisma.signal.findUnique({ where: { id } });
}
