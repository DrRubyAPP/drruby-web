"use client";

import { useState } from "react";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import {
  bloodPressureRecordValues,
  healthRecordExitStatus,
  healthRecordHighlight,
  numericHealthRecordValue,
} from "@/components/sections/portal/health/mappers";

type PlotPoint = {
  date: Date;
  value: number | null;
  plottedValue: number;
  isImputed: boolean;
  isExit: boolean;
};

type ChartTooltip = { x: number; y: number; label: string };
type HistoryValue = { value: number | null; isExit: boolean };

function chartDomain(values: number[]): { min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min !== max) return { min, max };

  // A flat series needs a meaningful visual domain. For the common positive
  // case (for example, a medication dose), place the value halfway between
  // zero and twice that value.
  if (min > 0) return { min: 0, max: min * 2 };
  if (min < 0) return { min: min * 2, max: 0 };

  // Zero has no proportional range, so use a small symmetric fallback.
  return { min: -1, max: 1 };
}

function axisLabel(value: number): string {
  if (Math.abs(value) < 1) return value.toFixed(2);
  return Math.abs(value) < 10 ? value.toFixed(1) : `${Math.round(value)}`;
}

function ChartAxis({
  min,
  max,
  y,
  width,
  height,
  left,
  right,
}: {
  min: number;
  max: number;
  y: (value: number) => number;
  width: number;
  height: number;
  left: number;
  right: number;
}) {
  const ticks = [max, (max + min) / 2, min];
  return (
    <g className="portal-v2__chart-axis">
      {ticks.map((value, index) => (
        <g key={`axis-tick-${index}`}>
          <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} />
          <text textAnchor="end" x={left - 7} y={y(value) + 4}>
            {axisLabel(value)}
          </text>
        </g>
      ))}
      <line x1={left} x2={left} y1={18} y2={height - 26} />
    </g>
  );
}

function FloatingTooltip({ tooltip, width, height }: {
  tooltip: ChartTooltip | null;
  width: number;
  height: number;
}) {
  if (!tooltip) return null;
  return (
    <div
      className="portal-v2__chart-tooltip"
      style={{ left: `${(tooltip.x / width) * 100}%`, top: `${(tooltip.y / height) * 100}%` }}
    >
      {tooltip.label}
    </div>
  );
}

function interpolatePoints(
  sorted: HealthRecordDto[],
  values: HistoryValue[],
): PlotPoint[] {
  return sorted.map((record, index) => {
    const entry = values[index]!;
    const value = entry.value;
    if (value !== null) {
      return {
        date: new Date(record.recordedAt),
        value,
        plottedValue: value,
        isImputed: false,
        isExit: entry.isExit,
      };
    }
    const beforeIndex = values.findLastIndex(
      (item, itemIndex) => itemIndex < index && item.value !== null,
    );
    const afterIndex = values.findIndex(
      (item, itemIndex) => itemIndex > index && item.value !== null,
    );
    const before = beforeIndex >= 0 ? values[beforeIndex]!.value : null;
    const after = afterIndex >= 0 ? values[afterIndex]!.value : null;
    let plottedValue = before ?? after ?? 0;
    if (before !== null && after !== null && beforeIndex >= 0 && afterIndex >= 0) {
      const beforeTime = new Date(sorted[beforeIndex]!.recordedAt).getTime();
      const afterTime = new Date(sorted[afterIndex]!.recordedAt).getTime();
      const currentTime = new Date(record.recordedAt).getTime();
      const fraction =
        afterTime === beforeTime
          ? (index - beforeIndex) / (afterIndex - beforeIndex)
          : (currentTime - beforeTime) / (afterTime - beforeTime);
      plottedValue = before + (after - before) * fraction;
    }
    return {
      date: new Date(record.recordedAt),
      value: null,
      plottedValue,
      isImputed: true,
      isExit: false,
    };
  });
}

function sortedRecords(records: HealthRecordDto[]) {
  return [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
}

function NumericHistory({ records }: { records: HealthRecordDto[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const sorted = sortedRecords(records);
  const points = interpolatePoints(
    sorted,
    sorted.map((record) => {
      const exit = healthRecordExitStatus(record);
      return {
        value: exit ? 0 : (numericHealthRecordValue(record)?.value ?? null),
        isExit: !!exit,
      };
    }),
  );
  const unit = records.map(numericHealthRecordValue).find(Boolean)?.unit;
  const values = points.map((point) => point.plottedValue);
  const { min, max } = chartDomain(values);
  const range = max - min;
  const start = new Date(sorted[0]!.recordedAt).getTime();
  const end = new Date(sorted.at(-1)!.recordedAt).getTime();
  const width = 480;
  const height = 190;
  const left = 52;
  const right = 20;
  const top = 18;
  const bottom = 26;
  const x = (point: PlotPoint) => {
    if (start === end) return width / 2;
    return left + ((point.date.getTime() - start) / (end - start)) * (width - left - right);
  };
  const y = (point: PlotPoint) =>
    height - bottom - ((point.plottedValue - min) / range) * (height - top - bottom);
  const axisY = (value: number) =>
    height - bottom - ((value - min) / range) * (height - top - bottom);
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(point)} ${y(point)}`).join(" ");

  return (
    <>
      <div className="portal-v2__chart-legend">
        <span><i className="portal-v2__legend-dot" /> Recorded value{unit ? ` · ${unit}` : ""}</span>
        <span><i className="portal-v2__legend-dot portal-v2__legend-dot--missing" /> No numeric value</span>
      </div>
      <div className="portal-v2__chart-wrap">
        <svg
          aria-label="Metric history line chart"
          className="portal-v2__metric-chart"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <ChartAxis height={height} left={left} max={max} min={min} right={right} width={width} y={axisY} />
          <path className="portal-v2__chart-line" d={path} fill="none" />
          {points.map((point, index) => {
            const record = sorted[index]!;
            const severity =
              record.kind === "symptom"
                ? healthRecordHighlight(record)?.value
                : null;
            const exit = healthRecordExitStatus(record);
            const label = point.isExit
              ? `${point.date.toLocaleDateString()} · ${exit}`
              : point.isImputed
              ? `${point.date.toLocaleDateString()} · no numeric value · interpolated to ${point.plottedValue.toFixed(1)}${unit ? ` ${unit}` : ""}`
              : severity
                ? `${point.date.toLocaleDateString()} · Severity: ${severity}`
              : `${point.date.toLocaleDateString()} · ${point.value}${unit ? ` ${unit}` : ""}`;
            if (point.isExit) {
              const crossSize = 3;
              return (
                <path
                  aria-label={`${exit} marker`}
                  className="portal-v2__chart-point--exit"
                  d={`M${x(point) - crossSize} ${y(point) - crossSize}L${x(point) + crossSize} ${y(point) + crossSize}M${x(point) + crossSize} ${y(point) - crossSize}L${x(point) - crossSize} ${y(point) + crossSize}`}
                  fill="none"
                  key={`${point.date.toISOString()}-${index}`}
                  onBlur={() => setTooltip(null)}
                  onFocus={() => setTooltip({ x: x(point), y: y(point), label })}
                  onMouseEnter={() => setTooltip({ x: x(point), y: y(point), label })}
                  onMouseLeave={() => setTooltip(null)}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  tabIndex={0}
                >
                  <title>{label}</title>
                </path>
              );
            }
            return (
              <circle
                className={point.isImputed ? "portal-v2__chart-point--missing" : "portal-v2__chart-point"}
                cx={x(point)}
                cy={y(point)}
                key={`${point.date.toISOString()}-${index}`}
                onBlur={() => setTooltip(null)}
                onFocus={() => setTooltip({ x: x(point), y: y(point), label })}
                onMouseEnter={() => setTooltip({ x: x(point), y: y(point), label })}
                onMouseLeave={() => setTooltip(null)}
                r={point.isImputed ? 5 : 4}
                tabIndex={0}
              >
                <title>{label}</title>
              </circle>
            );
          })}
        </svg>
        <FloatingTooltip height={height} tooltip={tooltip} width={width} />
      </div>
      <div className="portal-v2__chart-dates">
        <span>{points[0]?.date.toLocaleDateString()}</span>
        <span>{points.at(-1)?.date.toLocaleDateString()}</span>
      </div>
    </>
  );
}

function BloodPressureHistory({ records }: { records: HealthRecordDto[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const sorted = sortedRecords(records);
  const readings = sorted.map(bloodPressureRecordValues);
  const systolic = interpolatePoints(
    sorted,
    readings.map((reading) => ({
      value: reading?.systolic ?? null,
      isExit: false,
    })),
  );
  const diastolic = interpolatePoints(
    sorted,
    readings.map((reading) => ({
      value: reading?.diastolic ?? null,
      isExit: false,
    })),
  );
  const unit = readings.find((reading) => reading?.unit)?.unit;
  const values = [...systolic, ...diastolic].map((point) => point.plottedValue);
  const { min, max } = chartDomain(values);
  const range = max - min;
  const start = new Date(sorted[0]!.recordedAt).getTime();
  const end = new Date(sorted.at(-1)!.recordedAt).getTime();
  const width = 480;
  const height = 190;
  const left = 52;
  const right = 20;
  const top = 18;
  const bottom = 26;
  const x = (point: PlotPoint) =>
    start === end
      ? width / 2
      : left +
        ((point.date.getTime() - start) / (end - start)) * (width - left - right);
  const y = (point: PlotPoint) =>
    height - bottom - ((point.plottedValue - min) / range) * (height - top - bottom);
  const axisY = (value: number) =>
    height - bottom - ((value - min) / range) * (height - top - bottom);
  const path = (points: PlotPoint[]) =>
    points
      .map((point, index) => `${index ? "L" : "M"}${x(point)} ${y(point)}`)
      .join(" ");
  const renderPoints = (points: PlotPoint[], series: "systolic" | "diastolic") =>
    points.map((point, index) => (
      <circle
        className={`portal-v2__chart-point--${series}${point.isImputed ? " is-missing" : ""}`}
        cx={x(point)}
        cy={y(point)}
        key={`${series}-${point.date.toISOString()}-${index}`}
        onBlur={() => setTooltip(null)}
        onFocus={() => setTooltip({
          x: x(point),
          y: y(point),
          label: point.isImputed
            ? `${point.date.toLocaleDateString()} · ${series} missing · interpolated to ${point.plottedValue.toFixed(1)}${unit ? ` ${unit}` : ""}`
            : `${point.date.toLocaleDateString()} · ${series} ${point.value}${unit ? ` ${unit}` : ""}`,
        })}
        onMouseEnter={() => setTooltip({
          x: x(point),
          y: y(point),
          label: point.isImputed
            ? `${point.date.toLocaleDateString()} · ${series} missing · interpolated to ${point.plottedValue.toFixed(1)}${unit ? ` ${unit}` : ""}`
            : `${point.date.toLocaleDateString()} · ${series} ${point.value}${unit ? ` ${unit}` : ""}`,
        })}
        onMouseLeave={() => setTooltip(null)}
        r={point.isImputed ? 5 : 4}
        tabIndex={0}
      >
        <title>
          {point.isImputed
            ? `${series}: no numeric value (interpolated)`
            : `${series}: ${point.value}${unit ? ` ${unit}` : ""}`}
        </title>
      </circle>
    ));

  return (
    <>
      <div className="portal-v2__chart-legend">
        <span><i className="portal-v2__legend-dot portal-v2__legend-dot--systolic" /> Systolic{unit ? ` · ${unit}` : ""}</span>
        <span><i className="portal-v2__legend-dot portal-v2__legend-dot--diastolic" /> Diastolic{unit ? ` · ${unit}` : ""}</span>
        <span><i className="portal-v2__legend-dot portal-v2__legend-dot--missing" /> No numeric value</span>
      </div>
      <div className="portal-v2__chart-wrap">
        <svg
          aria-label="Blood pressure history line chart"
          className="portal-v2__metric-chart"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <ChartAxis height={height} left={left} max={max} min={min} right={right} width={width} y={axisY} />
          <path className="portal-v2__chart-line portal-v2__chart-line--systolic" d={path(systolic)} fill="none" />
          <path className="portal-v2__chart-line portal-v2__chart-line--diastolic" d={path(diastolic)} fill="none" />
          {renderPoints(systolic, "systolic")}
          {renderPoints(diastolic, "diastolic")}
        </svg>
        <FloatingTooltip height={height} tooltip={tooltip} width={width} />
      </div>
      <div className="portal-v2__chart-dates">
        <span>{systolic[0]?.date.toLocaleDateString()}</span>
        <span>{systolic.at(-1)?.date.toLocaleDateString()}</span>
      </div>
    </>
  );
}

function TextHistory({ records }: { records: HealthRecordDto[] }) {
  return (
    <div className="portal-v2__metric-list">
      {[...records].reverse().map((record) => {
        const exit = healthRecordExitStatus(record);
        const highlight = healthRecordHighlight(record);
        return (
          <div key={record.id}>
            <span>{new Date(record.recordedAt).toLocaleDateString()}</span>
            <b>{exit ?? highlight?.value ?? record.title}</b>
          </div>
        );
      })}
    </div>
  );
}

export function MetricHistoryDialog({
  title,
  records,
  onClose,
}: {
  title: string;
  records: HealthRecordDto[];
  onClose: () => void;
}) {
  const hasNumericData = records.some((record) => numericHealthRecordValue(record));
  const isBloodPressure = records[0]?.metricCode === "blood_pressure";
  return (
    <div className="portal-v2__history-overlay" onClick={onClose} role="presentation">
      <section
        aria-labelledby="metric-history-title"
        aria-modal="true"
        className="portal-v2__history-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close history" className="portal-v2__history-close" onClick={onClose} type="button">×</button>
        <p className="portal-v2__eyebrow">METRIC HISTORY</p>
        <h2 id="metric-history-title">{title}</h2>
        {isBloodPressure ? (
          <BloodPressureHistory records={records} />
        ) : hasNumericData ? (
          <NumericHistory records={records} />
        ) : (
          <TextHistory records={records} />
        )}
      </section>
    </div>
  );
}
