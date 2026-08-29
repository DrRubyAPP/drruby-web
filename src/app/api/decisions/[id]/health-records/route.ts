import { NextResponse } from "next/server";
import {
  ConnectRecordBody,
  DecisionHealthRecordListResponse,
  toDecisionHealthRecordDTO,
} from "@/app/api/health/dto";
import { requireUser } from "@/lib/auth/session";
import { decisionHealthRecordRepo, decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** 复用 decision ownership 预检（与 /api/decisions/[id] 一致） */
async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/**
 * List connected health records
 * @description 当前 Decision 已显式 Connect 的 active 健康记录（removedAt=null）。Contract §2：Record 进 My Health ≠ 自动进 Decision；仅显式 Connect
 * @response DecisionHealthRecordListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const links = await decisionHealthRecordRepo.listByDecision(id);
  return NextResponse.json(
    DecisionHealthRecordListResponse.parse(
      links.map(toDecisionHealthRecordDTO),
    ),
  );
});

/**
 * Connect health record to decision
 * @description 显式 Connect（Contract §2 / C6）：将一条 HealthRecord 关联到 Decision（Yourself 引用方式组装）。刷 Decision.lastUserActivityAt（§8 meaningful activity）。越权 404
 * @body ConnectRecordBody
 * @response { ok: true }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const body = ConnectRecordBody.parse(await req.json());
  await decisionHealthRecordRepo.connect(id, body.healthRecordId, user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
});

/**
 * Disconnect health record
 * @description 软删除留痕（C9）：置 removedAt，不实际 DELETE。刷 Decision.lastUserActivityAt
 * @queryParam healthRecordId string
 * @response { ok: true }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const { searchParams } = new URL(req.url);
  const healthRecordId = searchParams.get("healthRecordId");
  if (!healthRecordId) {
    throw new AppError("BAD_REQUEST", "缺少 healthRecordId", 400);
  }
  await decisionHealthRecordRepo.disconnect(id, healthRecordId);
  return NextResponse.json({ ok: true });
});
