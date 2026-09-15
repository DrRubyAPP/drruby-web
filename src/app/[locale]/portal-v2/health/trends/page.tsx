"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { HealthSnapshotDialog } from "@/components/sections/portal-v2/HealthSnapshotDialog";
import { PortalV2Frame } from "@/components/sections/portal-v2/PortalV2";
import type { TimelineEventDto } from "@/components/sections/portal/today/YourTimeline";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";

export default function HealthTrackingPage() {
  const router = useRouter();
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const { data, error, loading, refetch } =
    useApi<TimelineEventDto[]>("/api/timeline");
  const events = [...(data ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
        <h1>Tracking</h1>
        <div className="lede">
          See what changed, then open your health records at that point in time.
        </div>
        <section className="sec">
          <div className="sec-h">What’s changed</div>
          {loading ? (
            <Skeleton lines={5} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={refetch} />
          ) : events.length ? (
            <div className="card portal-v2__tracking-timeline">
              {events.map((event) => (
                <div key={event.id}>
                  <div className="portal-v2__tracking-event">
                    <div className="portal-v2__tracking-event-copy">
                      <time dateTime={event.date}>
                        {new Date(event.date).toLocaleDateString()}
                      </time>
                      <strong>{event.title}</strong>
                      {event.detail && <p>{event.detail}</p>}
                    </div>
                  </div>
                  <button
                    className="portal-v2__snapshot-button"
                    onClick={() => setSnapshotAt(event.date)}
                    type="button"
                  >
                    View health snapshot
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              hint="Add an update from the portal chat to begin tracking changes."
              title="No changes yet"
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
