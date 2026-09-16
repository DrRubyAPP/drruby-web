"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { HealthSnapshotDialog } from "@/components/sections/portal-v2/HealthSnapshotDialog";
import { PortalV2Frame } from "@/components/sections/portal-v2/PortalV2";
import {
  includesTimelineEvent,
  TimelineImportanceScale,
  type TimelineImportanceFilter,
} from "@/components/sections/portal-v2/TimelineImportanceScale";
import type { TimelineEventDto } from "@/components/sections/portal/today/YourTimeline";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";

export default function HealthTrendPage() {
  const router = useRouter();
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] =
    useState<TimelineImportanceFilter>("important");
  const { data, error, loading, refetch } =
    useApi<TimelineEventDto[]>("/api/timeline");
  const events = [...(data ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const visibleEvents = events.filter((event) =>
    includesTimelineEvent(event, importanceFilter),
  );
  return (
    <PortalV2Frame
      activeTab="health"
      onChanged={() => {}}
      onTabChange={(tab) => router.push(`/portal-v2?tab=${tab}`)}
    >
      <div className="portal-v2__detail-inner">
        <Link className="portal-v2__back" href="/portal-v2">
          ← Back to My Health
        </Link>
        <p className="portal-v2__eyebrow">YOUR HEALTH OVER TIME</p>
        <h1>Health Trend</h1>
        <div className="lede">
          See what changed, then open your health records at that point in time.
        </div>
        <section className="sec">
          <div className="portal-v2__trend-section-heading">
            <div className="sec-h">What’s changed</div>
            <TimelineImportanceScale
              onChange={setImportanceFilter}
              value={importanceFilter}
            />
          </div>
          {loading ? (
            <Skeleton lines={5} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={refetch} />
          ) : visibleEvents.length ? (
            <div className="card portal-v2__trend-timeline">
              {visibleEvents.map((event) => (
                <article className="portal-v2__trend-event" key={event.id}>
                  {event.importance === "minor" ? (
                    <span
                      aria-hidden="true"
                      className="portal-v2__trend-dot portal-v2__trend-dot--minor"
                    />
                  ) : (
                    <button
                      aria-label={`View health snapshot for ${new Date(event.date).toLocaleDateString()}`}
                      className="portal-v2__snapshot-button"
                      onClick={() => setSnapshotAt(event.date)}
                      title="View health snapshot"
                      type="button"
                    >
                      <span aria-hidden="true" />
                    </button>
                  )}
                  <div className="portal-v2__trend-event-copy">
                    <time dateTime={event.date}>
                      {new Date(event.date).toLocaleDateString()}
                    </time>
                    <strong>{event.title}</strong>
                    {event.detail && <p>{event.detail}</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              hint={
                events.length
                  ? "Choose a broader importance level to view more events."
                  : "Add an update from the portal chat to begin recording changes."
              }
              title={events.length ? "No events at this level" : "No changes yet"}
            />
          )}
        </section>
      </div>
      {snapshotAt && (
        <HealthSnapshotDialog
          at={snapshotAt}
          onClose={() => setSnapshotAt(null)}
        />
      )}
    </PortalV2Frame>
  );
}
