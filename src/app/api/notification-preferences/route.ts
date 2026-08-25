import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { notificationPreferenceRepo } from "@/lib/db";
import {
  type NotificationPrefKey,
  notificationPrefKeySchema,
} from "@/lib/db/enums";
import { handle } from "@/lib/errors";

/** 全部偏好 key（固定 4 项，枚举驱动） */
const ALL_KEYS = notificationPrefKeySchema.options;

/** 通知偏好项 */
export const NotificationPrefDTO = z.object({
  key: notificationPrefKeySchema,
  enabled: z.boolean(),
});
export const NotificationPrefListResponse = z.array(NotificationPrefDTO);

/** 更新单项偏好入参 */
export const UpdateNotificationPrefBody = z.object({
  key: notificationPrefKeySchema,
  enabled: z.boolean(),
});

/**
 * List notification preferences
 * @description 当前用户的通知偏好（固定 4 项；未写过的 key 返回默认值 enabled=true，GET 不落库）
 * @response NotificationPrefListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await notificationPreferenceRepo.listByUser(user.id);
  const byKey = new Map(
    rows.map((r) => [r.key as NotificationPrefKey, r.enabled]),
  );
  // DB 行与内存默认合并：读路径无副作用，PUT 才落库
  const dto = ALL_KEYS.map((key) => ({
    key,
    enabled: byKey.get(key) ?? true,
  }));
  return NextResponse.json(NotificationPrefListResponse.parse(dto));
});

/**
 * Update notification preference
 * @description 更新单项通知偏好（upsert；幂等）
 * @body UpdateNotificationPrefBody
 * @response NotificationPrefDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const body = UpdateNotificationPrefBody.parse(await req.json());
  const row = await notificationPreferenceRepo.setEnabled(
    user.id,
    body.key,
    body.enabled,
  );
  return NextResponse.json(
    NotificationPrefDTO.parse({ key: row.key, enabled: row.enabled }),
  );
});
