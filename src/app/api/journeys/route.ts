import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { journeyRepo } from "@/lib/db";
import { decisionTypeSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import { JourneyDTO, toJourneyDTO } from "./dto";

export const JourneyListResponse = z.array(JourneyDTO);

/**
 * List library journeys
 * @description Library 已共享 journey 列表（匿名化，可按 decisionType 筛选，最近更新在前）
 * @response JourneyListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  await requireUser();
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("decisionType");
  const decisionType = raw !== null ? decisionTypeSchema.parse(raw) : undefined;
  const rows = await journeyRepo.list({ decisionType });
  return NextResponse.json(JourneyListResponse.parse(rows.map(toJourneyDTO)));
});
