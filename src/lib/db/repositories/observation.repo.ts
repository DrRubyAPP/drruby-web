import { prisma } from "@/lib/db/prisma";

export async function create(input: {
  userId: string;
  decisionId?: string | null;
  title: string;
  cadence?: string | null;
}) {
  return prisma.observation.create({
    data: {
      userId: input.userId,
      decisionId: input.decisionId ?? null,
      title: input.title,
      cadence: input.cadence ?? null,
    },
  });
}

export async function listByUser(userId: string) {
  return prisma.observation.findMany({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}
