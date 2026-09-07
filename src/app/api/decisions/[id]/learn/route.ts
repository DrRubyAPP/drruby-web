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
  return existing;
}

/**
 * Save learning summary
 * @description §29 Stop→Learning 流程终态：写 kind=learning entry（append-only，synthesis 承载 {text, supportingObservationIds, generatedAt}）。task-51 D-51-a 按 lifecycle 分派：LEARNING → 首次保存，completeAfterLearning 原子转 COMPLETED（刷 lastUserActivityAt + 写 TimelineEvent）；COMPLETED → append-only 重生成，仅写新 entry，跳过生命周期转换（P-2 不写重复 "Completed" 事件），lifecycle 保持 COMPLETED。其余 lifecycle 422。越权 404
 * @body SaveLearningBody
 * @response { learning: EntryResponse, decision: DecisionDTO }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const decision = await assertDecisionOwner(user.id, id);

  const body = bodySchema.parse(await req.json());

  // task-51 D-51-a：LEARNING=首次保存；COMPLETED=append-only 重生成（仅写新 entry）
  if (decision.lifecycle !== "LEARNING" && decision.lifecycle !== "COMPLETED") {
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      `cannot save learning from lifecycle "${decision.lifecycle}"; must be LEARNING or COMPLETED`,
      422,
    );
  }

  try {
    const learning = await decisionEntryRepo.createLearning({
      decisionId: id,
      userId: user.id,
      text: body.text,
      supportingObservationIds: body.supportingObservationIds,
    });
    // COMPLETED 态跳过生命周期转换（P-2：不写重复 "Completed" TimelineEvent）
    const updated =
      decision.lifecycle === "LEARNING"
        ? await decisionRepo.completeAfterLearning({
            decisionId: id,
            userId: user.id,
          })
        : await decisionRepo.findById(id);
    if (!updated) {
      throw new AppError("NOT_FOUND", "决策不存在", 404);
    }
    return NextResponse.json({
      learning: toEntryDTO(learning),
      decision: toDecisionDTO(updated, { withBrief: false }),
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
