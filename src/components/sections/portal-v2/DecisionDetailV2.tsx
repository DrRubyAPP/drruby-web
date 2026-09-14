"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type { DecisionDetailDto } from "@/components/sections/portal/decisions/dto";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/navigation";

export function DecisionDetailV2({ id }: { id: string }) {
  const { data, error, loading, refetch } = useApi<DecisionDetailDto>(
    `/api/decisions/${id}`,
  );
  if (loading) return <Skeleton lines={7} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <EmptyState hint="It may have been removed." title="Decision not found" />;
  const context = data.healthContext as { records?: { id: string; title: string; kind: string }[] } | null;
  const entries = data.entries.filter((entry) => entry.kind === "observation");

  return (
    <main id="app-portal" className="portal-v2 portal-v2__detail">
      <div className="portal-v2__detail-inner">
        <Link className="portal-v2__back" href="/portal-v2">← Back to decisions</Link>
        <p className="portal-v2__eyebrow">YOUR DECISION</p>
        <h1>{data.topic || data.question}</h1>
        <div className="lede">{data.question}</div>

        <section className="sec">
          <div className="sec-h">Current understanding</div>
          <div className="card">
            <p>
              DrRuby is building an understanding from your health history and
              the updates you share. It will stay clear about what is known and
              what still needs context.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">Initial health context</div>
          <div className="card">
            {context?.records?.length ? (
              context.records.slice(0, 6).map((record) => (
                <div className="sub-row" key={record.id}>
                  <span>{record.title}</span><span className="arr">{record.kind}</span>
                </div>
              ))
            ) : (
              <p>We will bring in relevant records from My Health as you add them.</p>
            )}
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">What’s changed</div>
          <div className="card">
            {entries.length ? entries.map((entry) => (
              <div className="sub-row" key={entry.id}>
                <span>{entry.text}</span>
                <span className="arr">{new Date(entry.occurredAt).toLocaleDateString()}</span>
              </div>
            )) : <p>Share updates in the chat box from the main portal whenever something changes.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
