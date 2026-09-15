"use client";

import { use, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type { DecisionDetailDto } from "@/components/sections/portal/decisions/dto";
import { HealthSnapshotDialog } from "@/components/sections/portal-v2/HealthSnapshotDialog";
import { PortalV2Frame } from "@/components/sections/portal-v2/PortalV2";
import type { TimelineEventDto } from "@/components/sections/portal/today/YourTimeline";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";

export default function DecisionTrendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const { id: decisionId } = use(params);
  const { data, error, loading, refetch } = useApi<TimelineEventDto[]>(
    `/api/timeline?decisionId=${encodeURIComponent(decisionId)}`,
  );
  const { data: decision } = useApi<DecisionDetailDto>(
    `/api/decisions/${decisionId}`,
  );
  const events = [...(data ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <PortalV2Frame
      activeTab="decisions"
      onChanged={() => {}}
      onTabChange={(tab) => router.push(`/portal-v2?tab=${tab}`)}
    >
      <div className="portal-v2__detail-inner">
        <Link
          className="portal-v2__back"
          href={`/portal-v2/decisions/${decisionId}`}
        >
          ← Back to decision
        </Link>
        <p className="portal-v2__eyebrow">THIS DECISION, OVER TIME</p>
        <h1>Related Health Trend</h1>
        {decision && (
          <h2 className="portal-v2__related-decision-title">
            {decision.topic || decision.question}
          </h2>
        )}
        <div className="lede">
          Only the events connected to this decision, with your health records
          at each point in time.
        </div>
        <section className="sec">
          <div className="sec-h">What’s changed</div>
          {loading ? (
            <Skeleton lines={5} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={refetch} />
          ) : events.length ? (
            <div className="card portal-v2__trend-timeline">
              {events.map((event) => (
                <article className="portal-v2__trend-event" key={event.id}>
                  <button
                    aria-label={`View health snapshot for ${new Date(event.date).toLocaleDateString()}`}
                    className="portal-v2__snapshot-button"
                    onClick={() => setSnapshotAt(event.date)}
                    title="View health snapshot"
                    type="button"
                  >
                    <span aria-hidden="true" />
                  </button>
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
              hint="Updates connected to this decision will appear here."
              title="No decision changes yet"
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
