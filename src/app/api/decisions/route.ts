import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import { DecisionDTO, toDecisionDTO } from "./dto";

/** 决策列表（轻量，省 brief） */
export const DecisionListResponse = z.array(DecisionDTO);

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
