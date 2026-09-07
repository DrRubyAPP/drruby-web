import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { healthRecordRepo, healthRecordRevisionRepo } from "@/lib/db";
import {
  documentClassSchema,
  extractionConfidenceSchema,
} from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import type { ExtractionResult, Extractor } from "@/lib/health/extractor";
import { OpenAiExtractor } from "@/lib/health/extractor.openai";
import {
  AdvanceStatusBody,
  CorrectRecordBody,
  DismissConnectBody,
  toRecordDTO,
} from "../../dto";

type Ctx = { params: Promise<{ id: string }> };

// 便于测试注入 mock extractor（生产用 OpenAiExtractor，镜像 ask route 可注入模式）。
let extractor: Extractor = new OpenAiExtractor();
export function __setExtractor(e: Extractor): void {
  extractor = e;
}

/**
 * Get health record detail
 * @description 单条健康记录详情（含原件 + 修正历史，provenance 可追溯）
 * @response HealthRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const row = await healthRecordRepo.findById(id);
  // 越权按「不存在」处理：不泄露他人资源是否存在
  if (!row || row.userId !== user.id) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  // task-49 F3：软删按「不存在」处理（不泄露删除态）
  if (row.deletedAt) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  return NextResponse.json(toRecordDTO(row));
});

/**
 * Update health record（状态机推进 / 纠错）
 * @description PATCH action=advance 推进状态机；action=correct 走 HealthRecordRevision append-only（不静默覆盖原始提取）+ 同步更新 Record.parsedValues。越权 404
 * @body AdvanceStatusBody | CorrectRecordBody
 * @response HealthRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await healthRecordRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }

  const body = z
    .discriminatedUnion("action", [
      AdvanceStatusBody,
      CorrectRecordBody,
      DismissConnectBody,
    ])
    .parse(await req.json());

  if (body.action === "advance") {
    const updated = await healthRecordRepo.advanceStatus(id, body.status);
    return NextResponse.json(
      toRecordDTO({ ...updated, healthSource: existing.healthSource }),
    );
  }

  // task-49 D-1：「暂不处理」落库（幂等）；不产生任何 Decision/连接。
  // 与 Cancel 区分：Cancel 不发请求，无状态。
  if (body.action === "dismissConnect") {
    const updated = await healthRecordRepo.dismissConnect(id);
    return NextResponse.json(
      toRecordDTO({ ...updated, healthSource: existing.healthSource }),
    );
  }

  // correct: append-only revision + current 指针更新
  await healthRecordRevisionRepo.create({
    recordId: id,
    parsedValuesSnapshot: existing.parsedValues ?? {},
    newParsedValues: body.parsedValues as never,
    diffSummary: body.diffSummary,
    correctedBy: user.id,
    reason: body.reason,
  });

  const updated = await healthRecordRepo.findById(id);
  return NextResponse.json(toRecordDTO(updated!));
});

/**
 * Trigger extraction（task-48 D-9：前端触发 + 轮询；并入原 Retry 语义）
 * @description 触发真实抽取：置 PROCESSING → 同 hash 缓存命中则复用（F6），否则跑 OpenAiExtractor → 落 EXTRACTED_DRAFT（done）或 FAILED + error（failed，原件保留）。FAILED 态可 Retry（再 POST）。非法状态转移 409。越权 404
 * @response HealthRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await healthRecordRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  const source = existing.healthSource;

  // 置 PROCESSING（前端轮询可见）；非法转移（如 CONFIRMED/EXTRACTED_DRAFT）→ 409
  await healthRecordRepo.advanceStatus(id, "PROCESSING");

  // F6：打模型前先按 hash 查缓存，命中则复用已抽结果，不再打模型
  const cached = source.hash
    ? await healthRecordRepo.findDoneExtractionByHash(user.id, source.hash, id)
    : null;
  const result: ExtractionResult = cached
    ? {
        status: "done",
        parsedValues: cached.parsedValues as Record<string, unknown>,
        confidence: cached.confidence
          ? extractionConfidenceSchema.parse(cached.confidence)
          : undefined,
        documentClass: cached.documentClass
          ? documentClassSchema.parse(cached.documentClass)
          : undefined,
        pleaseConfirm: cached.pleaseConfirm,
      }
    : await extractor.extract(source);

  // done → EXTRACTED_DRAFT（清空历史失败原因）；failed → FAILED + 用户安全文案
  const updated =
    result.status === "done"
      ? await healthRecordRepo.updateExtraction(id, {
          status: "EXTRACTED_DRAFT",
          parsedValues: result.parsedValues as never,
          confidence: result.confidence ?? null,
          documentClass: result.documentClass ?? null,
          pleaseConfirm: result.pleaseConfirm ?? [],
          error: null,
        })
      : await healthRecordRepo.updateExtraction(id, {
          status: "FAILED",
          error: result.error ?? "抽取失败，请重试或手动录入",
        });

  return NextResponse.json(toRecordDTO({ ...updated, healthSource: source }));
});

/**
 * Soft-delete health record
 * @description task-49 F3 软删除留痕：置 deletedAt，不物理删除。列表默认过滤、详情按 404；已连接 Decision 侧渲染层占位降级。重复删除/越权 404
 * @response { ok: true }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await healthRecordRepo.findById(id);
  // 越权/已软删均按「不存在」处理（不泄露存在性与删除态）
  if (!existing || existing.userId !== user.id || existing.deletedAt) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  await healthRecordRepo.softDelete(id);
  return NextResponse.json({ ok: true });
});
