import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionEntryRepo, decisionRepo } from "@/lib/db";
import { decisionStatusSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { DecisionEntryDTO, toEntryDTO } from "../../dto";

/**
 * 追加决策时间线条目入参。
 * append-only：本端点仅 POST，**不提供 PATCH/PUT/DELETE**，原始记录永不覆盖。
 */
export const AppendEntryBody = z.object({
  text: z.string().min(1).describe("条目文本"),
  status: decisionStatusSchema
    .optional()
    .describe("当时决策状态快照（缺省沿用决策当前状态）"),
  occurredAt: z.string().optional().describe("发生时间 ISO（缺省 now）"),
});

/** 追加后的条目 */
export const EntryResponse = DecisionEntryDTO;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Append decision entry
 * @description 向决策追加一条 append-only 时间线条目（不可编辑/删除）。越权按 404 处理
 * @body AppendEntryBody
 * @response EntryResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const decision = await decisionRepo.findById(id);
  if (!decision || decision.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const body = AppendEntryBody.parse(await req.json());
  const entry = await decisionEntryRepo.append({
    decisionId: id,
    userId: user.id,
    text: body.text,
    // 快照缺省用决策当前状态
    statusSnapshot: decisionStatusSchema.parse(body.status ?? decision.status),
    occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
  });
  return NextResponse.json(toEntryDTO(entry), { status: 201 });
});
