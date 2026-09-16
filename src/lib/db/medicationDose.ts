import type { Prisma } from "~prisma/client";

type Dose = { value: number; unit: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseDose(value: unknown): Dose | null {
  if (isObject(value)) {
    const numeric =
      typeof value.value === "number"
        ? value.value
        : typeof value.value === "string"
          ? Number(value.value.replaceAll(",", ""))
          : Number.NaN;
    const unit = typeof value.unit === "string" ? value.unit.trim() : "";
    return Number.isFinite(numeric) && unit ? { value: numeric, unit } : null;
  }

  if (typeof value !== "string") return null;
  const match = value.trim().match(/^([+-]?[\d,.]+)\s*(\S.*)$/);
  if (!match) return null;
  const numeric = Number(match[1].replaceAll(",", ""));
  const unit = match[2].trim();
  return Number.isFinite(numeric) && unit ? { value: numeric, unit } : null;
}

/**
 * Medication doses are stored canonically as `{ dose: { value, unit } }`.
 * Older callers may still send a display string such as `"500 mg"` or use
 * the legacy `dosage` key; normalize those values at every write boundary.
 */
export function normalizeMedicationParsedValues(
  parsedValues: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | null | undefined {
  if (!isObject(parsedValues)) return parsedValues;
  const values = parsedValues as Record<string, unknown>;

  const dose = parseDose(values.dose ?? values.dosage);
  if (!dose) return parsedValues;

  const { dosage: _legacyDosage, ...rest } = values;
  return { ...rest, dose } as Prisma.InputJsonValue;
}
