import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { hormoneReadingRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import type { HormoneReading } from "~prisma/client";

/** App `types.ts` HormoneReading（`note` 空 → ""） */
export const HormoneReadingDTO = z.object({
  id: z.string(),
  marker: z.string(),
  value: z.string(),
  phase: z.string(),
  note: z.string(),
});
export const HormoneListResponse = z.array(HormoneReadingDTO);

function toDTO(row: HormoneReading): z.infer<typeof HormoneReadingDTO> {
  return {
    id: row.id,
    marker: row.marker,
    value: row.value,
    phase: row.phase,
    note: row.note ?? "",
  };
}

/**
 * List hormone-layer readings
 * @description 当前用户的激素层读数（周期上下文，最新在前）
 * @response HormoneListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await hormoneReadingRepo.listByUser(user.id);
  return NextResponse.json(HormoneListResponse.parse(rows.map(toDTO)));
});
