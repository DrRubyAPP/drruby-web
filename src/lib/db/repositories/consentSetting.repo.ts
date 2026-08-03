import { type ConsentKey, consentKeySchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { ConsentSetting } from "~prisma/client";

export interface UpsertConsentInput {
  key: ConsentKey;
  title: string;
  description: string;
  value: boolean;
  locked?: boolean;
}

export async function upsert(
  userId: string,
  input: UpsertConsentInput,
): Promise<ConsentSetting> {
  consentKeySchema.parse(input.key);
  return prisma.consentSetting.upsert({
    where: { userId_key: { userId, key: input.key } },
    create: { userId, ...input },
    update: {
      title: input.title,
      description: input.description,
      value: input.value,
      locked: input.locked,
    },
  });
}

export async function listByUser(userId: string): Promise<ConsentSetting[]> {
  return prisma.consentSetting.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/** 切换开关：locked 档拒绝（self 永开）。返回更新后的行。 */
export async function setValue(
  id: string,
  value: boolean,
): Promise<ConsentSetting> {
  const row = await prisma.consentSetting.findUnique({ where: { id } });
  if (!row) throw new Error("consent setting not found");
  if (row.locked) throw new Error("locked consent cannot be changed");
  return prisma.consentSetting.update({ where: { id }, data: { value } });
}
