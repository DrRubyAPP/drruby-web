import { z } from "zod";
import { referralStatusSchema } from "@/lib/db/enums";

/** 转介 DTO（列表/详情共用）：金额由 Decimal 序列化为字符串。 */
export const ReferralDTO = z.object({
  id: z.string(),
  fromUserId: z.string(),
  requestedService: z.string().nullable(),
  status: referralStatusSchema,
  note: z.string().nullable(),
  flaggedMetrics: z.unknown().nullable(),
  commissionAmount: z.string().nullable(),
});

export const ReferralListResponse = z.object({
  items: z.array(ReferralDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const UpdateReferralBody = z.object({
  status: referralStatusSchema,
  commissionAmount: z.union([z.number(), z.string()]).nullable().optional(),
});

/** 把 DB row 投影为 DTO。 */
export type ReferralRow = {
  id: string;
  fromUserId: string;
  requestedService: string | null;
  status: string;
  note: string | null;
  flaggedMetrics: unknown;
  commissionAmount: { toString(): string } | null;
};

export function toReferralDTO(
  row: ReferralRow,
): z.infer<typeof ReferralDTO> {
  return {
    id: row.id,
    fromUserId: row.fromUserId,
    requestedService: row.requestedService,
    status: row.status as z.infer<typeof referralStatusSchema>,
    note: row.note,
    flaggedMetrics: row.flaggedMetrics as z.infer<typeof ReferralDTO>["flaggedMetrics"],
    commissionAmount: row.commissionAmount
      ? row.commissionAmount.toString()
      : null,
  };
}
