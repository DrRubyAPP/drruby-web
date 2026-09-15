import type { HealthRecordHighlight } from "@/components/sections/portal/health/mappers";

export function HealthRecordValueCue({
  highlight,
}: {
  highlight: HealthRecordHighlight;
}) {
  if (highlight.type === "symptom") {
    return (
      <span
        aria-label={`Severity: ${highlight.value}`}
        className="portal-v2__value-cue portal-v2__value-cue--severity"
        title={`Severity: ${highlight.value}`}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <i
            aria-hidden="true"
            className={level <= highlight.level ? "is-active" : undefined}
            key={level}
          />
        ))}
        <b>{highlight.value}</b>
      </span>
    );
  }

  const icon =
    highlight.type === "vitals"
      ? "⌁"
      : highlight.type === "medication"
        ? "●"
        : "↻";
  return (
    <span className="portal-v2__value-cue" title={highlight.value}>
      <i aria-hidden="true">{icon}</i>
      <b>{highlight.value}</b>
    </span>
  );
}
