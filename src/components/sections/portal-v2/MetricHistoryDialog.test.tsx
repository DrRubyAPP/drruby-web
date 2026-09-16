import { fireEvent, render, screen } from "@testing-library/react";
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

function medicationRecord(
  id: string,
  recordedAt: string,
  dosage: string,
): HealthRecordDto {
  return {
    id,
    sourceId: `${id}-source`,
    kind: "medication",
    metricCode: "estradiol_patch",
    title: "Estradiol transdermal patch",
    status: "CONFIRMED",
    parsedValues: { dosage },
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

  it("uses zero, the value, and twice the value for a flat positive series", () => {
    render(
      <MetricHistoryDialog
        onClose={vi.fn()}
        records={[medicationRecord("patch", "2026-08-01T09:00:00.000Z", "0.05")]}
        title="Estradiol transdermal patch"
      />,
    );

    const axisLabels = Array.from(
      screen
        .getByRole("img", { name: "Metric history line chart" })
        .querySelectorAll(".portal-v2__chart-axis text"),
    ).map((label) => label.textContent);
    expect(axisLabels).toEqual(["0.10", "0.05", "0.00"]);
  });

  it("plots a resolved numeric metric as zero and supports a later reactivation", () => {
    render(
      <MetricHistoryDialog
        onClose={vi.fn()}
        records={[
          severityRecord("reactivated", "2026-08-03T09:00:00.000Z", "mild"),
          {
            ...severityRecord("resolved", "2026-08-02T09:00:00.000Z", "moderate"),
            parsedValues: { status: "resolved" },
          },
          severityRecord("active", "2026-08-01T09:00:00.000Z", "severe"),
        ]}
        title="Skin condition"
      />,
    );

    const chart = screen.getByRole("img", { name: "Metric history line chart" });
    const exit = chart.querySelector(".portal-v2__chart-point--exit");
    expect(exit).toHaveAttribute("aria-label", "resolved marker");
    expect(exit).toHaveAttribute("d", expect.stringContaining("L"));
    fireEvent.mouseEnter(exit!);
    expect(
      screen.getByText(/resolved/, { selector: ".portal-v2__chart-tooltip" }),
    ).toBeVisible();

    const activePoints = chart.querySelectorAll(".portal-v2__chart-point");
    expect(activePoints).toHaveLength(2);
  });

  it("plots a stopped medication as a zero-valued cross", () => {
    render(
      <MetricHistoryDialog
        onClose={vi.fn()}
        records={[
          {
            ...medicationRecord("stopped", "2026-08-02T09:00:00.000Z", "5 mg"),
            parsedValues: { dosage: "5 mg", status: "stopped" },
          },
          medicationRecord("active", "2026-08-01T09:00:00.000Z", "5 mg"),
        ]}
        title="Biotin"
      />,
    );

    expect(screen.getByLabelText("stopped marker")).toBeVisible();
  });

  it("renders only in-range important event markers without changing metric x positions", () => {
    render(
      <MetricHistoryDialog
        events={[
          {
            id: "in-range",
            date: "2026-08-02T09:00:00.000Z",
            importance: "important",
            title: "Started a new treatment",
            detail: "Monthly check-in",
          },
          {
            id: "out-of-range",
            date: "2026-08-04T09:00:00.000Z",
            importance: "important",
            title: "Later event",
          },
        ]}
        onClose={vi.fn()}
        records={[
          severityRecord("new", "2026-08-03T09:00:00.000Z", "severe"),
          severityRecord("old", "2026-08-01T09:00:00.000Z", "mild"),
        ]}
        title="Skin condition"
      />,
    );

    const chart = screen.getByRole("img", { name: "Metric history line chart" });
    expect(chart.querySelectorAll(".portal-v2__chart-event-marker")).toHaveLength(1);
    expect(screen.getByLabelText("Important event: Started a new treatment")).toHaveAttribute("x1", "256");
    expect(chart.querySelectorAll(".portal-v2__chart-point")).toHaveLength(2);

    fireEvent.mouseEnter(
      screen.getByLabelText("Important event: Started a new treatment"),
    );
    expect(screen.getByText(/Monthly check-in/, { selector: ".portal-v2__chart-tooltip" })).toBeVisible();
  });

  it("prioritizes an end-state signal over frequency in text history", () => {
    render(
      <MetricHistoryDialog
        onClose={vi.fn()}
        records={[
          {
            ...medicationRecord("stopped", "2026-08-02T09:00:00.000Z", ""),
            kind: "treatment",
            parsedValues: { status: "stopped", frequency: "monthly" },
          },
          {
            ...medicationRecord("active", "2026-08-01T09:00:00.000Z", ""),
            kind: "treatment",
            parsedValues: { frequency: "monthly" },
          },
        ]}
        title="Treatment"
      />,
    );

    expect(screen.getByText("stopped")).toBeVisible();
    expect(screen.getByText("monthly")).toBeVisible();
  });
});
