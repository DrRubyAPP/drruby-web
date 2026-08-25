import { z } from "zod";
import { journeySourceTypeSchema } from "@/lib/db/enums";
import type { Journey, JourneyUpdate } from "~prisma/client";

/** Library journey 列表项（匿名化：不含 authorUserId） */
export const JourneyDTO = z.object({
  id: z.string(),
  decisionType: z.string().nullable(),
  goal: z.string().nullable(),
  concern: z.string().nullable(),
  timingContext: z.string().nullable(),
  summary: z.string(),
  outcome: z.string().nullable(),
  sourceType: journeySourceTypeSchema,
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** living journey 的版本更新（详情附带，version 正序） */
export const JourneyUpdateDTO = z.object({
  id: z.string(),
  version: z.number().int(),
  note: z.string(),
  createdAt: z.string(),
});

/** 详情：Journey + updates */
export const JourneyDetailDTO = JourneyDTO.extend({
  updates: z.array(JourneyUpdateDTO),
});

export function toJourneyDTO(row: Journey): z.infer<typeof JourneyDTO> {
  return {
    id: row.id,
    decisionType: row.decisionType,
    goal: row.goal,
    concern: row.concern,
    timingContext: row.timingContext,
    summary: row.summary,
    outcome: row.outcome,
    sourceType: journeySourceTypeSchema.parse(row.sourceType),
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toJourneyUpdateDTO(
  row: JourneyUpdate,
): z.infer<typeof JourneyUpdateDTO> {
  return {
    id: row.id,
    version: row.version,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}
