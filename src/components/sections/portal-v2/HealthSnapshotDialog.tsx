"use client";

import { ErrorState, Skeleton } from "@/components/api";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import {
  healthRecordExitStatus,
  healthRecordHighlight,
  healthRecordMetricKey,
} from "@/components/sections/portal/health/mappers";
import { useApi } from "@/hooks/useApi";
import { HealthRecordValueCue } from "./HealthRecordValueCue";

const GROUPS = [
  { title: "Vitals", kinds: ["vitals"] },
  { title: "Labs", kinds: ["lab"] },
  { title: "Medication", kinds: ["medication"] },
  { title: "Conditions", kinds: ["symptom"] },
  { title: "Treatments", kinds: ["treatment"] },
];

/** This view is calculated on demand from records, rather than saved. */
export function HealthSnapshotDialog({
  at,
  onClose,
}: {
  at: string;
  onClose: () => void;
}) {
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>(
    `/api/health/records?at=${encodeURIComponent(at)}`,
  );
  const records = latestRecordsByMetric(data ?? []);

  return (
    <div
      aria-labelledby="health-snapshot-title"
      aria-modal="true"
      className="portal-v2__history-overlay"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="portal-v2__history-dialog portal-v2__snapshot-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close health snapshot"
          className="portal-v2__history-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="portal-v2__eyebrow">YOUR HEALTH AT THIS POINT</p>
        <h2 id="health-snapshot-title">{new Date(at).toLocaleDateString()}</h2>
        {loading ? (
          <Skeleton lines={5} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : records.length === 0 ? (
          <p className="portal-v2__snapshot-empty">
            No health records had been added at this point.
          </p>
        ) : (
          <div className="portal-v2__health-grid">
            {GROUPS.map((group) => {
              const groupRecords = records.filter((record) =>
                group.kinds.includes(record.kind),
              );
              if (!groupRecords.length) return null;
              return (
                <div className="card portal-v2__body-group" key={group.title}>
                  <h3>{group.title}</h3>
                  {groupRecords.map((record) => {
                    const highlight = healthRecordHighlight(record);
                    const ended = healthRecordExitStatus(record);
                    return (
                      <div className="sub-row" key={record.id}>
                        <span>{record.displayName ?? record.title}</span>
                        <span className="portal-v2__record-meta">
                          {!ended && highlight && (
                            <HealthRecordValueCue highlight={highlight} />
                          )}
                          <span className="arr">
                            {ended ??
                              new Date(record.recordedAt).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function latestRecordsByMetric(records: HealthRecordDto[]): HealthRecordDto[] {
  const seen = new Set<string>();
  return [...records]
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )
    .filter((record) => {
      const key = healthRecordMetricKey(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
