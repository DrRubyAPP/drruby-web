import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionEntryRepo, decisionRepo } from "@/lib/db";
import {
  assertLifecycleForOutcome,
  type DecisionKind,
  type DecisionOutcome,
  decisionKindSchema,
  decisionLifecycleSchema,
  decisionTypeSchema,
  isValidOutcomeForKind,
  lifecycleForOutcome,
  outcomeSchema,
  topicSlugSchema,
} from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import {
  DecisionDetailDTO,
  DecisionDTO,
  toDecisionDTO,
  toEntryDTO,
} from "../dto";

/** 决策详情（含 brief 快照 + append-only entries） */
export const DecisionResponse = DecisionDetailDTO;

/** 更新决策入参（lifecycle 三维 + question/type/saved/yourselfContext） */
export const UpdateDecisionBody = z.object({
  question: z.string().min(1).optional(),
  type: decisionTypeSchema.nullable().optional(),
  topic: z.string().max(200).nullable().optional(),
  topicSlug: topicSlugSchema.nullable().optional(),
  lifecycle: decisionLifecycleSchema.optional(),
  decisionKind: decisionKindSchema.optional(),
  outcome: outcomeSchema.nullable().optional(),
  nextStep: z.string().max(500).nullable().optional(),
  saved: z.boolean().optional().describe("Keep this 置 true；Not-now 不传"),
  yourselfContext: z
    .string()
    .optional()
    .describe("Yourself 轻量文字背景（随 Keep 一并保存）"),
});
/** PATCH 返回的单个决策（省 brief） */
export const DecisionItemResponse = DecisionDTO;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get decision detail
 * @description 单个决策详情（含三源 brief 快照与 append-only 时间线条目）
 * @response DecisionResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const row = await decisionRepo.findByIdWithEntries(id);
  // 越权按「不存在」处理：不泄露他人资源是否存在
  if (!row || row.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const dto: z.infer<typeof DecisionDetailDTO> = {
    ...toDecisionDTO(row, { withBrief: true }),
    entries: row.entries.map(toEntryDTO),
  };
  return NextResponse.json(DecisionResponse.parse(dto));
});

/**
 * Update decision
 * @description 更新决策 lifecycle 三维（decisionKind/outcome/nextStep/lifecycle）与 question/type/saved/yourselfContext。B6 reclassify 自动清空非法 outcome；D4 freshness gate（存在 archived_outcome entry 时 freshnessCheckedAt 须新于该 entry）；B7 outcome=null 反悔回 ACTIVE；decidedAt 按 outcome 派生。非法组合 422；越权按 404 处理
 * @body UpdateDecisionBody
 * @response DecisionItemResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await decisionRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const body = UpdateDecisionBody.parse(await req.json());

  // Prisma 行字段推断为 string | null；cast 到枚举 union 供校验函数使用
  const existingKind = existing.decisionKind as DecisionKind | null;
  const existingOutcome = existing.outcome as DecisionOutcome | null;

  // B6 reclassify 自动清空：kind 变化且现有 outcome 不在新 kind 合法集 → 清空 outcome/nextStep + 必要时回退 ACTIVE
  if (
    body.decisionKind &&
    body.decisionKind !== existingKind &&
    existingOutcome &&
    !isValidOutcomeForKind(body.decisionKind, existingOutcome)
  ) {
    body.outcome = null;
    body.nextStep = null;
    if (existing.lifecycle === "DECIDED" || existing.lifecycle === "CLOSED") {
      body.lifecycle = "ACTIVE";
    }
    // decidedAt 由下方 outcome 派生逻辑统一处理（outcome=null → decidedAt=null）
  }

  // F3 + FRESHNESS GATE (D4) + decidedAt 派生：仅当提交非空 outcome 时
  let derivedDecidedAt: Date | null | undefined = undefined;
  if (body.outcome !== undefined && body.outcome != null) {
    // D4 freshness gate：存在 archived_outcome entry 时，freshnessCheckedAt 必须新于该 entry
    const archived = await decisionEntryRepo.findLastArchivedEntry(id);
    if (archived) {
      if (
        !existing.freshnessCheckedAt ||
        existing.freshnessCheckedAt <= archived.occurredAt
      ) {
        throw new AppError(
          "FRESHNESS_GATE_REQUIRED",
          "Reopen 后需先 Check now 刷新信息再决定",
          422,
        );
      }
    }

    // F3 派生 lifecycle（覆盖客户端所传，按映射表强制）
    body.lifecycle = lifecycleForOutcome(body.outcome);
    // B8：V1 中 decided_on_next_step 停在 DECIDED，不主动转 COMPLETED
    derivedDecidedAt =
      body.lifecycle === "DECIDED" || body.lifecycle === "CLOSED"
        ? new Date()
        : null;
  } else if (body.outcome === null) {
    // outcome 显式清空 → ACTIVE + decidedAt=null（B7 反悔路径）
    body.lifecycle = "ACTIVE";
    derivedDecidedAt = null;
  }

  // outcome↔lifecycle 一致性双重校验（防客户端绕过）
  // 注意：B6 清空后 body.outcome=null（合法），不能用 `?? existingOutcome` fallback
  // —— 否则会用旧 outcome 校验新的 ACTIVE lifecycle，误抛错。
  if (body.lifecycle !== undefined) {
    const outcomeForCheck =
      body.outcome !== undefined ? body.outcome : existingOutcome;
    assertLifecycleForOutcome(outcomeForCheck, body.lifecycle);
  }

  let row: Awaited<ReturnType<typeof decisionRepo.update>>;
  try {
    // 若 body 未传 decisionKind 但提交了 outcome，用 existing kind 兜底校验
    // outcome↔kind 一致性（req F2：outcome 前须先 classify）。
    row = await decisionRepo.update(id, {
      question: body.question,
      type: body.type,
      topic: body.topic,
      topicSlug: body.topicSlug,
      lifecycle: body.lifecycle,
      decisionKind: body.decisionKind ?? existingKind,
      outcome: body.outcome,
      nextStep: body.nextStep,
      saved: body.saved,
      yourselfContext: body.yourselfContext,
      decidedAt: derivedDecidedAt,
    });
  } catch (err) {
    // repo 的 assertOutcomeForKind / route 的 assertLifecycleForOutcome 抛普通 Error → 非法组合
    if (err instanceof AppError) throw err;
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      err instanceof Error ? err.message : "非法的 outcome 组合",
      422,
      { cause: err },
    );
  }
  return NextResponse.json(toDecisionDTO(row, { withBrief: false }));
});
