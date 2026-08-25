import {
  type NotificationPrefKey,
  notificationPrefKeySchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { NotificationPreference } from "~prisma/client";

export async function listByUser(
  userId: string,
): Promise<NotificationPreference[]> {
  return prisma.notificationPreference.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * PUT 才落库：未写过的 key GET 时由 API 层用内存默认值（enabled=true）合并，
 * 保证读路径无副作用（与 consentSetting seed 预建行模式不同，是有意选择）。
 */
export async function setEnabled(
  userId: string,
  key: NotificationPrefKey,
  enabled: boolean,
): Promise<NotificationPreference> {
  notificationPrefKeySchema.parse(key);
  return prisma.notificationPreference.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, enabled },
    update: { enabled },
  });
}
