import { type ExperimentStatus, experimentStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Experiment } from "~prisma/client";

export interface CreateExperimentInput {
  title: string;
  hypothesis: string;
  status: ExperimentStatus;
  window: string;
}

export async function create(
  userId: string,
  input: CreateExperimentInput,
): Promise<Experiment> {
  experimentStatusSchema.parse(input.status);
  return prisma.experiment.create({ data: { userId, ...input } });
}

export async function listByUser(userId: string): Promise<Experiment[]> {
  return prisma.experiment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateStatus(
  id: string,
  status: ExperimentStatus,
): Promise<Experiment> {
  experimentStatusSchema.parse(status);
  return prisma.experiment.update({ where: { id }, data: { status } });
}
