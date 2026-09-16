import { describe, expect, it } from "vitest";
import { normalizeMedicationParsedValues } from "./medicationDose";

describe("normalizeMedicationParsedValues", () => {
  it("converts legacy string doses to the canonical object shape", () => {
    expect(
      normalizeMedicationParsedValues({
        dosage: "1,000 mg",
        frequency: "once daily",
      }),
    ).toEqual({
      dose: { value: 1000, unit: "mg" },
      frequency: "once daily",
    });
  });

  it("normalizes an object dose and preserves unrelated values", () => {
    expect(
      normalizeMedicationParsedValues({
        dose: { value: "500", unit: " mg " },
        status: "active",
      }),
    ).toEqual({ dose: { value: 500, unit: "mg" }, status: "active" });
  });

  it("leaves an unparseable value unchanged", () => {
    expect(normalizeMedicationParsedValues({ dosage: "as directed" })).toEqual(
      { dosage: "as directed" },
    );
  });
});
