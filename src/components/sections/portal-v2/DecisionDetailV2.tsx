"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type {
  DecisionDetailDto,
  DecisionEntryDto,
} from "@/components/sections/portal/decisions/dto";
import type {
  DecisionHealthRecordDto,
  HealthRecordDto,
} from "@/components/sections/portal/health/dto";
import {
  healthRecordHighlight,
  healthRecordMetricKey,
} from "@/components/sections/portal/health/mappers";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";
import { decisionStatusLabel } from "./decisionStatus";
import { HealthRecordValueCue } from "./HealthRecordValueCue";
import {
  type MetricHistoryEvent,
  MetricHistoryDialog,
} from "./MetricHistoryDialog";
import { type ComposerRequest, PortalV2Frame } from "./PortalV2";

export function DecisionDetailV2({ id }: { id: string }) {
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<HealthRecordDto | null>(
    null,
  );
  const [showAllComments, setShowAllComments] = useState(false);
  const [composerRequest, setComposerRequest] =
    useState<ComposerRequest | null>(null);
  const { data, error, loading, refetch } = useApi<DecisionDetailDto>(
    `/api/decisions/${id}`,
  );
  const connectedRecords = useApi<DecisionHealthRecordDto[]>(
    `/api/decisions/${id}/health-records`,
  );
  const healthRecords = useApi<HealthRecordDto[]>("/api/health/records");
  const timeline = useApi<MetricHistoryEvent[]>(`/api/timeline?decisionId=${id}`);
  const observationComments = useApi<{ observations: DecisionEntryDto[] }>(
    `/api/decisions/${id}/observations`,
  );

  useEffect(() => setShowAllComments(false), [id]);

  let content: ReactNode;
  if (loading) {
    content = <Skeleton lines={7} />;
  } else if (error) {
    content = <ErrorState message={error.message} onRetry={refetch} />;
  } else if (!data) {
    content = (
      <EmptyState hint="It may have been removed." title="Decision not found" />
    );
  } else {
    const observedRecord = observationMetric(connectedRecords.data ?? []);
    const metricHistory = observedRecord
      ? (healthRecords.data ?? []).filter(
          (record) =>
            observedRecord.observationId
              ? record.observationId === observedRecord.observationId
              : healthRecordMetricKey(record) ===
                healthRecordMetricKey(observedRecord),
        )
      : [];
    const currentMetric = latestRecord(metricHistory) ?? observedRecord;
    const currentMetricHighlight = currentMetric
      ? healthRecordHighlight(currentMetric)
      : null;
    const observationDue = Boolean(data.observationDueAt);
    const comments = [...(observationComments.data?.observations ?? [])].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    const visibleComments = showAllComments ? comments : comments.slice(0, 1);

    content = (
      <div className="portal-v2__detail-inner portal-v2__decision-detail">
        <Link className="portal-v2__back" href="/portal-v2?tab=decisions">
          ← Back to decisions
        </Link>
        <div className="portal-v2__detail-heading">
          <p className="portal-v2__eyebrow">YOUR DECISION</p>
          <span className="portal-v2__status">
            {decisionStatusLabel(data.lifecycle)}
          </span>
        </div>
        <h1>{data.topic || data.question}</h1>
        <div className="lede">{data.question}</div>

        <section className="sec">
          <div className="sec-h">Current understanding</div>
          <div className="card">
            {data.currentUnderstanding ? (
              <div className="portal-v2__understanding">
                <div>
                  <h3>Yourself</h3>
                  <p>{data.currentUnderstanding.yourself}</p>
                </div>
                <div>
                  <h3>Others</h3>
                  <p>{data.currentUnderstanding.others}</p>
                </div>
                <div>
                  <h3>Science</h3>
                  <p>{data.currentUnderstanding.science}</p>
                </div>
              </div>
            ) : (
              <p>We’re preparing your current understanding.</p>
            )}
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">Observation</div>
          <div className="card portal-v2__body-group portal-v2__decision-observation">
            {connectedRecords.loading || healthRecords.loading ? (
              <Skeleton lines={1} />
            ) : currentMetric ? (
              <div className="sub-row portal-v2__metric-row">
                <button
                  className="portal-v2__metric-button"
                  onClick={() => setSelectedMetric(currentMetric)}
                  type="button"
                >
                  <span>{currentMetric.displayName ?? currentMetric.title}</span>
                  <span className="portal-v2__record-meta">
                    {currentMetricHighlight && (
                      <HealthRecordValueCue highlight={currentMetricHighlight} />
                    )}
                    <span className="arr">
                      {new Date(currentMetric.recordedAt).toLocaleDateString()}
                    </span>
                  </span>
                </button>
                {observationDue && (
                  <button
                    className="portal-v2__observation-due"
                    onClick={() =>
                      setComposerRequest((current) => ({
                        prompt: `Update observation ${currentMetric.displayName ?? currentMetric.title}: `,
                        requestId: (current?.requestId ?? 0) + 1,
                      }))
                    }
                    type="button"
                  >
                    (due)
                  </button>
                )}
              </div>
            ) : (
              <p>No health metric is being observed for this decision yet.</p>
            )}

            {observationComments.loading ? (
              <Skeleton lines={1} />
            ) : visibleComments.length > 0 ? (
              <div className="portal-v2__decision-comments">
                <h3>Your comments</h3>
                {visibleComments.map((comment) => (
                  <article key={comment.id}>
                    <p>{comment.text}</p>
                    <time dateTime={comment.occurredAt}>
                      {new Date(comment.occurredAt).toLocaleDateString()}
                    </time>
                  </article>
                ))}
                {comments.length > 1 && !showAllComments && (
                  <button
                    className="portal-v2__show-more"
                    onClick={() => setShowAllComments(true)}
                    type="button"
                  >
                    Show more
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">More health trend</div>
          <Link
            className="card portal-v2__tracking-link"
            href={`/portal-v2/decisions/${id}/trends`}
          >
            <span>
              <strong>View related health trend</strong>
              <small>
                Follow your events and view your <b>complete</b> health shape at each point in time.
              </small>
            </span>
            <span className="arr" aria-hidden="true">
              ›
            </span>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <PortalV2Frame
      activeTab="decisions"
      composerRequest={composerRequest}
      onChanged={refetch}
      onTabChange={(tab) => router.push(`/portal-v2?tab=${tab}`)}
    >
      {content}
      {selectedMetric && (
        <MetricHistoryDialog
          events={(timeline.data ?? []).filter(
            (event) => event.importance === "important",
          )}
          onClose={() => setSelectedMetric(null)}
          records={
            healthRecords.data?.filter(
              (record) =>
                selectedMetric.observationId
                  ? record.observationId === selectedMetric.observationId
                  : healthRecordMetricKey(record) ===
                    healthRecordMetricKey(selectedMetric),
            ) ?? [selectedMetric]
          }
          title={selectedMetric.displayName ?? selectedMetric.title}
        />
      )}
    </PortalV2Frame>
  );
}

/**
 * Tracking records carry a relational observationId. This distinguishes a
 * metric collected for observation from other health context connected to the
 * same decision. A single unmarked legacy record remains a compatible fallback.
 */
function observationMetric(
  links: DecisionHealthRecordDto[],
): HealthRecordDto | null {
  const tracked = links.find((link) => link.healthRecord.observationId);
  return (
    tracked?.healthRecord ??
    (links.length === 1 ? links[0]!.healthRecord : null)
  );
}

function latestRecord(records: HealthRecordDto[]): HealthRecordDto | null {
  return (
    [...records].sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )[0] ?? null
  );
}
