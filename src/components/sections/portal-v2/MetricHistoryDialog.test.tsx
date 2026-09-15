import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import { MetricHistoryDialog } from "./MetricHistoryDialog";

function severityRecord(
  id: string,
  recordedAt: string,
  severity: string,
): HealthRecordDto {
  return {
    id,
    sourceId: `${id}-source`,
    kind: "symptom",
    metricCode: "skin_condition",
    title: "Skin condition check-in",
    status: "CONFIRMED",
    parsedValues: { severity },
    recordedAt,
  };
}

describe("MetricHistoryDialog", () => {
  it("plots severity records left-to-right by date even when the API order is newest first", () => {
    render(
      <MetricHistoryDialog
        onClose={vi.fn()}
        records={[
          severityRecord("new", "2026-08-03T09:00:00.000Z", "severe"),
          severityRecord("middle", "2026-08-02T09:00:00.000Z", "moderate"),
          severityRecord("old", "2026-08-01T09:00:00.000Z", "mild"),
        ]}
        title="Skin condition"
      />,
    );

    const points = Array.from(
      screen
        .getByRole("img", { name: "Metric history line chart" })
        .querySelectorAll(".portal-v2__chart-point"),
    );
    expect(points.map((point) => Number(point.getAttribute("cx")))).toEqual([
      52, 256, 460,
    ]);
  });
});
