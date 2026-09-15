import { prisma } from "@/lib/db/prisma";

type RecordIdentity = {
  kind: string;
  metricCode: string;
  title: string;
};

/**
 * Resolves the normalized display name for a record. `other` intentionally
 * keeps the member-provided title: it has no product-curated identity yet.
 * The title fallback also keeps historic rows readable during catalog rollout.
 */
export async function resolveDisplayName({
  kind,
  metricCode,
  title,
}: RecordIdentity): Promise<string> {
  if (metricCode === "other") return title;

  const definition = await (() => {
    switch (kind) {
      case "vitals":
        return prisma.healthVitalMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "medication":
        return prisma.healthMedicationMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "treatment":
        return prisma.healthTreatmentMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "symptom":
        return prisma.healthSymptomMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "checkup":
        return prisma.healthCheckupMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "lab":
        return prisma.healthLabMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      case "imaging":
        return prisma.healthImagingMetricDefinition.findUnique({
          where: { metricCode },
          select: { displayName: true },
        });
      default:
        return Promise.resolve(null);
    }
  })();

  return definition?.displayName ?? title;
}
