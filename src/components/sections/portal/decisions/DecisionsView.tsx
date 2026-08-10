"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { DecisionDetailDrawer } from "./DecisionDetailDrawer";
import type { DecisionDto } from "./dto";
import { DECISION_CHIPS, groupDecisions, statusToLabel } from "./mappers";
import { NewDecisionDrawer } from "./NewDecisionDrawer";

/**
 * My Decisions 视图：替换 portal/page.tsx 的 v-decisions inline 段。
 * - GET /api/decisions → 按 status 分组（active / saved）
 * - Start a new decision chips → 打开 NewDecisionDrawer（预填 chip）
 * - 列表卡片点击 → 打开 DecisionDetailDrawer（GET /api/decisions/[id]）
 */
export function DecisionsView() {
  const { data, error, loading, refetch } =
    useApi<DecisionDto[]>("/api/decisions");
  const [newDrawerChip, setNewDrawerChip] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  function handleCreated(id: string) {
    setNewDrawerChip(null);
    setDetailId(id);
    refetch();
  }

  return (
    <>
      <h1>My Decisions</h1>
      <div className="lede">
        Treatments, products and clinics live inside a decision &mdash; not as
        separate folders to maintain.
      </div>

      {/* Start a new decision */}
      <div className="sec">
        <div className="sec-h">Start a new decision</div>
        <div className="card">
          <div
            style={{ fontSize: 14, color: "var(--p-ink)", marginBottom: 10 }}
          >
            What are you considering?
          </div>
          <div className="ask-ex">
            {DECISION_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                className="ask-chip"
                onClick={() => setNewDrawerChip(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#a89a95", marginTop: 12 }}>
            DrRuby helps you understand the decision before you make it &mdash;
            it doesn&apos;t ask you to start a diary.
          </div>
        </div>
      </div>

      {/* 主体：四态 */}
      {loading ? (
        <Skeleton lines={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No decisions yet"
          hint="Start a new decision above."
        />
      ) : (
        <DecisionsList items={data} onSelect={setDetailId} />
      )}

      {newDrawerChip !== null && (
        <NewDecisionDrawer
          chip={newDrawerChip}
          onClose={() => setNewDrawerChip(null)}
          onCreated={handleCreated}
        />
      )}
      {detailId !== null && (
        <DecisionDetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={refetch}
        />
      )}
    </>
  );
}

/** Active + Saved 两组渲染（仅展示，无内部状态）。 */
function DecisionsList({
  items,
  onSelect,
}: {
  items: DecisionDto[];
  onSelect: (id: string) => void;
}) {
  const { active, saved } = groupDecisions(items);
  return (
    <>
      {active.length > 0 && (
        <div className="sec">
          <div className="sec-h">Active decisions</div>
          {active.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onClick={() => onSelect(d.id)}
            />
          ))}
        </div>
      )}
      {saved.length > 0 && (
        <div className="sec">
          <div className="sec-h">Saved &amp; completed</div>
          {saved.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onClick={() => onSelect(d.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** 单个决策卡片，复用 portal.css 的 .dcard 系列。 */
function DecisionCard({
  decision,
  onClick,
}: {
  decision: DecisionDto;
  onClick: () => void;
}) {
  return (
    <div
      className="dcard"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="dcard-ic">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
        </svg>
      </div>
      <div className="dcard-main">
        <div className="dcard-top">
          <h4>{decision.question}</h4>
          <span className="dec-badge">{statusToLabel(decision.status)}</span>
        </div>
        <div className="st">Updated {formatRelative(decision.updated)}</div>
      </div>
    </div>
  );
}

/** ISO → 简单的相对时间（粗略，前端不依赖 luxon）。 */
function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  const day = 86400000;
  if (Number.isNaN(ts)) return "recently";
  const days = Math.floor(diff / day);
  if (days < 1) return "today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  return new Date(iso).toLocaleDateString();
}
