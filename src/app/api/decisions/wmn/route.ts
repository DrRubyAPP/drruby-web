import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import { DecisionDTO, toDecisionDTO } from "../dto";

/** What Matters Now 信封：≤3 排序卡片 + 三态计数（前端只消费，不重排/不重算可见性） */
export const WmnResponse = z.object({
  cards: z.array(DecisionDTO),
  total: z.number().int().nonnegative(),
  actionableCount: z.number().int().nonnegative(),
  checkInDueCount: z.number().int().nonnegative(),
});

/** 最多 3 张卡（§7） */
const WMN_MAX = 3;

/**
 * What Matters Now
 * @description Home 驱动源：服务端产出 P1/P2/P3 已排序、≤3、去重的卡片 + 三态计数
 * @response WmnResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();

  const [all, actionable] = await Promise.all([
    decisionRepo.listByUser(user.id), // total（含 CLOSED/COMPLETED）
    decisionRepo.listByUserActionable(user.id), // 已按 lastUserActivityAt DESC
  ]);

  // P1 — Check-in Due（OBSERVING + nextCheckInAt<=now）：task-44 §30 真实查询
  const checkInDue = await decisionRepo.listDueForCheckIn(user.id);

  // P1 → P2 → P3；同 decision_id 至多一次（§7）
  const seen = new Set<string>();
  const ordered = [...checkInDue, ...actionable].filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  const cards = ordered
    .slice(0, WMN_MAX)
    .map((r) => toDecisionDTO(r, { withBrief: false }));

  return NextResponse.json(
    WmnResponse.parse({
      cards,
      total: all.length,
      actionableCount: actionable.length,
      checkInDueCount: checkInDue.length,
    }),
  );
});
