"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/navigation";

export default function HealthTrendsPage() {
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>("/api/health/records");
  const kinds = useMemo(
    () => Array.from(new Set((data ?? []).map((record) => record.kind))),
    [data],
  );
  const [kind, setKind] = useState<string>("");
  const shown = (data ?? []).filter((record) => !kind || record.kind === kind);
  return (
    <main id="app-portal" className="portal-v2 portal-v2__detail">
      <div className="portal-v2__detail-inner">
        <Link className="portal-v2__back" href="/portal-v2">← Back to My Health</Link>
        <p className="portal-v2__eyebrow">YOUR HEALTH OVER TIME</p>
        <h1>Trends</h1>
        <div className="lede">Choose a type of health information to see its timeline.</div>
        <label className="portal-v2__filter">
          Health information
          <select onChange={(event) => setKind(event.target.value)} value={kind}>
            <option value="">All records</option>
            {kinds.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        {loading ? <Skeleton lines={5} /> : error ? <ErrorState message={error.message} onRetry={refetch} /> : shown.length ? (
          <div className="card portal-v2__trend-chart" aria-label="Health records over time">
            {shown.slice().reverse().map((record, index) => (
              <div className="portal-v2__trend-point" key={record.id} style={{ left: `${(index / Math.max(shown.length - 1, 1)) * 92 + 4}%` }}>
                <span title={record.title} />
                <small>{new Date(record.recordedAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        ) : <EmptyState hint="Add health information from the portal chat to begin a trend." title="No records for this view" />}
      </div>
    </main>
  );
}
