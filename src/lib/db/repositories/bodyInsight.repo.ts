import {
  type BodyInsightKind,
  bodyInsightKindSchema,
  type InsightAccent,
  type InsightTone,
  insightAccentSchema,
  insightToneSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { BodyInsight, Prisma } from "~prisma/client";

export interface CreateBodyInsightInput {
  kind: BodyInsightKind;
  title: string;
  tag?: string | null;
  body?: string | null;
  accent?: InsightAccent | null;
  label?: string | null;
  value?: string | null;
  caption?: string | null;
  tone?: InsightTone | null;
  meta?: Prisma.InputJsonValue | null;
}

function validateInput(input: CreateBodyInsightInput): void {
  bodyInsightKindSchema.parse(input.kind);
  if (input.accent !== undefined && input.accent !== null) {
    insightAccentSchema.parse(input.accent);
  }
  if (input.tone !== undefined && input.tone !== null) {
    insightToneSchema.parse(input.tone);
  }
}

export async function create(
  userId: string,
  input: CreateBodyInsightInput,
): Promise<BodyInsight> {
  validateInput(input);
  const { meta, ...rest } = input;
  return prisma.bodyInsight.create({
    data: {
      userId,
      ...rest,
      meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/** 按 kind 列出（服务 attention / aging_velocity 两端点），最新在前 */
export async function listByUserAndKind(
  userId: string,
  kind: BodyInsightKind,
): Promise<BodyInsight[]> {
  bodyInsightKindSchema.parse(kind);
  return prisma.bodyInsight.findMany({
    where: { userId, kind },
    orderBy: { createdAt: "desc" },
  });
}
