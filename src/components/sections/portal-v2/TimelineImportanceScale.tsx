"use client";

import { useId } from "react";
import type { TimelineEventDto } from "@/components/sections/portal/today/YourTimeline";

export type TimelineImportanceFilter = "important" | "medium" | "all";

const OPTIONS: { label: string; value: TimelineImportanceFilter }[] = [
  { label: "Important only", value: "important" },
  { label: "Important & medium", value: "medium" },
  { label: "All", value: "all" },
];

export function includesTimelineEvent(
  event: TimelineEventDto,
  filter: TimelineImportanceFilter,
) {
  return (
    filter === "all" ||
    event.importance === "important" ||
    (filter === "medium" && event.importance === "medium")
  );
}

export function TimelineImportanceScale({
  value,
  onChange,
}: {
  value: TimelineImportanceFilter;
  onChange: (value: TimelineImportanceFilter) => void;
}) {
  const id = useId();
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);
  const selectedOption = OPTIONS[selectedIndex];

  return (
    <div className="portal-v2__importance-scale">
      <div className="portal-v2__importance-scale-heading">
        <label htmlFor={id}>Event importance</label>
        <output htmlFor={id}>{selectedOption.label}</output>
      </div>
      <input
        aria-valuetext={selectedOption.label}
        id={id}
        max={OPTIONS.length - 1}
        min="0"
        onChange={(event) => onChange(OPTIONS[Number(event.target.value)].value)}
        step="1"
        type="range"
        value={selectedIndex}
      />
      <div aria-hidden="true" className="portal-v2__importance-scale-labels">
        {OPTIONS.map((option) => (
          <span key={option.value}>{option.label}</span>
        ))}
      </div>
    </div>
  );
}
