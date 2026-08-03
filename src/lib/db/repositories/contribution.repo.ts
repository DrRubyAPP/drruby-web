import { prisma } from "@/lib/db/prisma";
import type { Contribution } from "~prisma/client";

export interface CreateContributionInput {
  title: string;
  description: string;
  shared?: boolean;
}

export async function create(
  userId: string,
  input: CreateContributionInput,
): Promise<Contribution> {
  return prisma.contribution.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      shared: input.shared ?? false,
      sharedAt: input.shared ? new Date() : null,
    },
  });
}

export async function listByUser(userId: string): Promise<Contribution[]> {
  return prisma.contribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** opt-in / 撤回：shared=true 写 sharedAt；false 写 withdrawnAt（可撤回） */
export async function setShared(
  id: string,
  shared: boolean,
): Promise<Contribution> {
  return prisma.contribution.update({
    where: { id },
    data: shared
      ? { shared: true, sharedAt: new Date(), withdrawnAt: null }
      : { shared: false, withdrawnAt: new Date() },
  });
}
