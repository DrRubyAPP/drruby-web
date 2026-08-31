import { NextResponse } from "next/server";
import { z } from "zod";
import { HealthContextDTO } from "@/app/api/decisions/dto";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { healthContextStatusSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { Prisma } from "~prisma/client";

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/** PUT /health-context 入参：§19/D5 5 类 JSON + status */
export const UpdateHealthContextBody = z.object({
  healthContext: z.record(z.string(), z.unknown()).nullable().optional(),
  status: healthContextStatusSchema.optional(),
});

/**
 * Get health context
 * @description §19/D5 5 类结构化 health context（已有答案预填，用户主要确认"有什么变化"）。越权 404
 * @response HealthContextDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const existing = await assertDecisionOwner(user.id, id);

  return NextResponse.json(
    HealthContextDTO.parse({
      healthContext: existing.healthContext,
      status: existing.healthContextStatus,
      healthContextConfirmedAt: existing.healthContextConfirmedAt
        ? existing.healthContextConfirmedAt.toISOString()
        : null,
    }),
  );
});

/**
 * Update health context
 * @description §19/D5 写入 5 类结构化 health context；status=confirmed 刷 confirmedAt（§20）；永不自动从 unconfirmed 转 confirmed。刷 lastUserActivityAt（§8）。越权 404
 * @body UpdateHealthContextBody
 * @response HealthContextDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const body = UpdateHealthContextBody.parse(await req.json());
  const row = await decisionRepo.updateHealthContext(id, {
    healthContext:
      body.healthContext === undefined
        ? undefined
        : body.healthContext === null
          ? Prisma.JsonNull
          : (body.healthContext as Prisma.InputJsonValue),
    status: body.status,
  });
  return NextResponse.json(
    HealthContextDTO.parse({
      healthContext: row.healthContext,
      status: row.healthContextStatus,
      healthContextConfirmedAt: row.healthContextConfirmedAt
        ? row.healthContextConfirmedAt.toISOString()
        : null,
    }),
  );
});

/**
 * Confirm health context
 * @description §20 DECIDE 前 gate：用户确认当前 health context（"Confirm no changes"）。置 status=confirmed + 刷 confirmedAt。永不自动从 unconfirmed 转 confirmed。越权 404
 * @response HealthContextDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  // status 转 confirmed；healthContext 不变（用户仅确认"无变化"）
  const row = await decisionRepo.updateHealthContext(id, {
    status: "confirmed",
  });
  return NextResponse.json(
    HealthContextDTO.parse({
      healthContext: row.healthContext,
      status: row.healthContextStatus,
      healthContextConfirmedAt: row.healthContextConfirmedAt
        ? row.healthContextConfirmedAt.toISOString()
        : null,
    }),
  );
});
