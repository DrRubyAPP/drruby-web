"use client";

import { ErrorState } from "@/components/api";
import { useApi } from "@/hooks/useApi";

export interface TimelineEventDto {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail?: string;
  source?: string;
}

export function YourTimeline({
  refreshKey,
  emptyMessage = "No activity yet",
  errorMessage = "Couldn't load timeline",
}: {
  refreshKey?: number;
  emptyMessage?: string;
  errorMessage?: string;
}) {
  const path =
    refreshKey === undefined
      ? "/api/timeline"
      : `/api/timeline?portalV2=${refreshKey}`;
  const { data, error, loading, refetch } = useApi<TimelineEventDto[]>(path);
  const recent = (data ?? [])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <section className="sec">
      <div className="sec-h">Your timeline</div>
      <div className="card">
        <div className="tl">
          {loading ? (
            <div className="tl-empty">…</div>
          ) : error ? (
            <ErrorState message={errorMessage} onRetry={refetch} />
          ) : recent.length === 0 ? (
            <div className="tl-empty">{emptyMessage}</div>
          ) : (
            recent.map((event) => (
              <div className="tl-item" key={event.id}>
                <span className="tl-dot" aria-hidden="true" />
                <div className="tl-d">
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="tl-t">{event.title}</div>
                {event.detail && (
                  <div className="tl-detail">{event.detail}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
