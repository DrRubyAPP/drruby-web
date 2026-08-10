"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { TimelineEventDto } from "./dto";
import { mapTimeline } from "./mappers";

const INITIAL_VISIBLE = 20;
const STEP = 20;

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

/** History 视图：渲染身体时间线（GET /api/timeline），客户端分页 + 四态。 */
export function HistoryView() {
  const { data, error, loading, refetch } =
    useApi<TimelineEventDto[]>("/api/timeline");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const page = mapTimeline(data ?? [], visibleCount);

  if (loading) {
    return (
      <div className="sec">
        <div className="sec-h">Your story over time</div>
        <Skeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sec">
        <div className="sec-h">Your story over time</div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  if (page.items.length === 0) {
    return (
      <div className="sec">
        <div className="sec-h">Your story over time</div>
        <EmptyState
          title="No history yet"
          hint="Your timeline will appear here as you record decisions, treatments, and reflections."
        />
      </div>
    );
  }

  return (
    <div className="sec">
      <div className="sec-h">Your story over time</div>
      <div className="card">
        <div className="tl">
          {page.items.map((it) => (
            <div className="tl-item" key={it.id}>
              <span className="tl-dot" />
              <div className="tl-d">
                {MONTH_YEAR.format(it.date)} &middot;{" "}
                <span className="hist-tag">{it.label}</span>
              </div>
              <div className="tl-t">{it.title}</div>
              {it.hasDetail && <div className="tl-t">{it.detail}</div>}
              {it.hasSource && (
                <div className="why-src" style={{ marginTop: 4 }}>
                  {it.source}
                </div>
              )}
            </div>
          ))}
        </div>
        {page.hasMore && (
          <button
            type="button"
            className="mn-see"
            onClick={() => setVisibleCount((c) => c + STEP)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              marginTop: 16,
            }}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
