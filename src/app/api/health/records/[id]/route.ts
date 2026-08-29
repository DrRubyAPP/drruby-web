import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { healthRecordRepo, healthRecordRevisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { AdvanceStatusBody, CorrectRecordBody, toRecordDTO } from "../../dto";

type Ctx = { params: Promise<{ id: string }> };

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
    .discriminatedUnion("action", [AdvanceStatusBody, CorrectRecordBody])
    .parse(await req.json());

  if (body.action === "advance") {
    const updated = await healthRecordRepo.advanceStatus(id, body.status);
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
 * Retry extraction
 * @description 重新触发抽取（FAILED 态可 Retry；INSUFFICIENT 留 task-43）。V1 走 mock 抽取
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

  // task-42 V1：Retry 仅推进状态机回 PROCESSING；真实抽取由前端 / 异步任务调用 Extractor
  // 这里不直接调用 Extractor（route 保持无副作用；mock 抽取在测试中通过 repo.updateExtraction 推进）
  const updated = await healthRecordRepo.advanceStatus(id, "PROCESSING");
  return NextResponse.json(
    toRecordDTO({ ...updated, healthSource: existing.healthSource }),
  );
});
