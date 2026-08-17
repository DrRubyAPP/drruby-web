import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiReport } from "@/lib/ai-reports/generate";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { aiReportRepo, aiReportTypeSchema, findingLevelSchema } from "@/lib/db";
import { handle } from "@/lib/errors";
import type { AiReport } from "~prisma/client";

// ---------- DTO ----------

export const AiReportFindingDTO = z.object({
  level: findingLevelSchema,
  tag: z.string(),
  title: z.string(),
  desc: z.string(),
});

export const AiReportDTO = z.object({
  id: z.string(),
  type: aiReportTypeSchema,
  title: z.string(),
  summary: z.string(),
  findings: z.array(AiReportFindingDTO).nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AiReportDTO = z.infer<typeof AiReportDTO>;

export const AiReportListResponse = z.object({
  data: z.array(AiReportDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

/** 把 repo 行（Date 字段）转为 DTO（ISO 字符串）。 */
export function toAiReportDTO(row: AiReport): AiReportDTO {
  return {
    id: row.id,
    type: aiReportTypeSchema.parse(row.type),
    title: row.title,
    summary: row.summary,
    findings: AiReportFindingDTO.array().nullable().parse(row.findings),
    meta: (row.meta ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------- POST：生成 ----------

export const CreateAiReportBody = z.object({
  type: aiReportTypeSchema.describe("报告类型：skin|hormone|body"),
});

/**
 * Generate AI report
 * @description 按类型同步生成一条 AI 报告（规则提炼 findings + LLM 仅润色，可降级）
 * 并落库，返回完整报告（201）。数据源为空返回 422；重操作 per-user 限流
 * （突发 5 次、每 10 分钟回 1 令牌）。
 * @body CreateAiReportBody
 * @response AiReportDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  // 报告生成是重操作（LLM + DB）→ per-user 限流：突发 5、每 10 分钟回 1（Retry-After=600s）
  await rateLimit(user.id, {
    routeTag: "ai-reports",
    capacity: 5,
    refillRate: 1 / 600,
  });
  const { type } = CreateAiReportBody.parse(await req.json());
  const report = await generateAiReport(user.id, type);
  return NextResponse.json(toAiReportDTO(report), { status: 201 });
});

// ---------- GET：分页列表 ----------

const ListQuery = z.object({
  type: aiReportTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const PAGE_SIZE = 20;

/**
 * List AI reports
 * @description 当前用户的 AI 报告分页列表（createdAt desc，可按 type 过滤）。
 * @query type string 可选：skin|hormone|body
 * @query page integer 默认 1
 * @response AiReportListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const { type, page } = ListQuery.parse({
    type: url.searchParams.get("type") ?? undefined,
    page: url.searchParams.get("page") ?? 1,
  });
  const { data, total } = await aiReportRepo.listByUser(user.id, {
    type,
    page,
    pageSize: PAGE_SIZE,
  });
  return NextResponse.json({
    data: data.map(toAiReportDTO),
    total,
    page,
    pageSize: PAGE_SIZE,
  } satisfies z.infer<typeof AiReportListResponse>);
});
