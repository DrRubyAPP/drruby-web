import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { decisionStatusSchema, decisionTypeSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import { DecisionDTO, toDecisionDTO } from "./dto";

/** 决策列表（轻量，省 brief） */
export const DecisionListResponse = z.array(DecisionDTO);

/** 单个决策（新建/列表项形状，省 brief） */
export const DecisionItemResponse = DecisionDTO;

/** 新建决策入参 */
export const CreateDecisionBody = z.object({
  question: z.string().min(1).describe("决策问题"),
  goal: z
    .string()
    .min(1)
    .describe("该决策服务的目标（对齐 concern_goals 词汇）"),
  status: decisionStatusSchema,
  type: decisionTypeSchema.optional().describe("预设决策类型（可空）"),
});

/**
 * List decisions
 * @description 当前用户的决策列表（省 brief，最新更新在前）
 * @response DecisionListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await decisionRepo.listByUser(user.id);
  const dto = rows.map((r) => toDecisionDTO(r, { withBrief: false }));
  return NextResponse.json(DecisionListResponse.parse(dto));
});

/**
 * Create decision
 * @description 新建一个决策（归属当前用户）
 * @body CreateDecisionBody
 * @response DecisionItemResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = CreateDecisionBody.parse(await req.json());
  const row = await decisionRepo.create(user.id, {
    question: body.question,
    goal: body.goal,
    status: body.status,
    type: body.type ?? null,
  });
  return NextResponse.json(toDecisionDTO(row, { withBrief: false }), {
    status: 201,
  });
});
