import {
  type AiReportType,
  aiReportTypeSchema,
  type FindingLevel,
  findingLevelSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { AiReport, Prisma } from "~prisma/client";

/** 单条 finding（对齐前端 mock AIReport.findings：level/tag/title/desc） */
export interface AiReportFinding {
  level: FindingLevel;
  tag: string;
  title: string;
  desc: string;
}

export interface CreateAiReportInput {
  type: AiReportType;
  title: string;
  summary: string;
  findings?: AiReportFinding[] | null;
  meta?: Prisma.InputJsonValue | null;
}

function validateInput(input: CreateAiReportInput): void {
  aiReportTypeSchema.parse(input.type);
  for (const f of input.findings ?? []) {
    findingLevelSchema.parse(f.level);
  }
}

export async function create(
  userId: string,
  input: CreateAiReportInput,
): Promise<AiReport> {
  validateInput(input);
  const { findings, meta, ...rest } = input;
  return prisma.aiReport.create({
    data: {
      userId,
      ...rest,
      findings: (findings ?? undefined) as Prisma.InputJsonValue | undefined,
      meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/** 分页列表（createdAt desc），type 可选过滤 */
export async function listByUser(
  userId: string,
  opts: { type?: AiReportType; page: number; pageSize: number },
): Promise<{ data: AiReport[]; total: number }> {
  if (opts.type) aiReportTypeSchema.parse(opts.type);
  const where = { userId, ...(opts.type ? { type: opts.type } : {}) };
  const [data, total] = await prisma.$transaction([
    prisma.aiReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.aiReport.count({ where }),
  ]);
  return { data, total };
}

export async function findById(id: string): Promise<AiReport | null> {
  return prisma.aiReport.findUnique({ where: { id } });
}
