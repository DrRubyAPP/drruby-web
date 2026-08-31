import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionEntryRepo, decisionRepo } from "@/lib/db";
import { buildLearningTemplate } from "@/lib/db/repositories/learning.template";
import { AppError, handle } from "@/lib/errors";
import { toDecisionDTO, toEntryDTO } from "../../dto";

const bodySchema = z.object({
  text: z.string().min(1),
  supportingObservationIds: z.array(z.string()).default([]),
});

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
}

/**
 * Save learning summary
 * @description §29 Stop→Learning 流程终态：写 kind=learning entry（append-only，synthesis 承载 {text, supportingObservationIds, generatedAt}）+ lifecycle: LEARNING → COMPLETED 原子事务。刷 lastUserActivityAt + 写 TimelineEvent。非 LEARNING 422。越权 404
 * @body SaveLearningBody
 * @response { learning: EntryResponse, decision: DecisionDTO }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const body = bodySchema.parse(await req.json());

  try {
    const learning = await decisionEntryRepo.createLearning({
      decisionId: id,
      userId: user.id,
      text: body.text,
      supportingObservationIds: body.supportingObservationIds,
    });
    const decision = await decisionRepo.completeAfterLearning({
      decisionId: id,
      userId: user.id,
    });
    return NextResponse.json({
      learning: toEntryDTO(learning),
      decision: toDecisionDTO(decision, { withBrief: false }),
    });
  } catch (e) {
    throw new AppError("UNPROCESSABLE_ENTITY", (e as Error).message, 422);
  }
});

/**
 * Get learning template prefill
 * @description §29 Stop→Learning 流程的 UI 表单预填：纯模板拼装（D1，不引入 LLM）返回 {text, supportingObservationIds}，supportingObservationIds 默认全选（D12 用户可在 UI 取消个别）。不展示 Emerging/Moderate/Strong/置信度%（§29 禁用）。越权 404
 * @queryParam locale "en" | "zh"（默认 "en"）
 * @response { template: { text: string, supportingObservationIds: string[] } }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const localeParam = new URL(req.url).searchParams.get("locale");
  const locale = localeParam === "zh" ? "zh" : "en";

  const observations = await decisionEntryRepo.listByDecisionAndKind(
    id,
    "observation",
  );
  const template = buildLearningTemplate({ observations, locale });
  return NextResponse.json({ template });
});
