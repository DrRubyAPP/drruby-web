"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/i18n/navigation";
import type { DecisionDto } from "./dto";
import {
  DECISION_CHIPS,
  goalToLabel,
  groupDecisions,
  lifecycleToLabel,
} from "./mappers";
import { NewDecisionDrawer } from "./NewDecisionDrawer";

/**
 * My Decisions 视图：4 个 section 常驻（设计稿结构）。
 * - Start a new decision chips → 打开 NewDecisionDrawer（预填 chip）
 * - Active decisions / Saved & completed ← GET /api/decisions
 * - Saved 为次要筛选（§11 纯书签：客户端过滤 d.saved，不改数据层）
 * - Inside a decision 为静态示例区块
 * - 列表卡片点击 → 路由到 /portal/decisions/[id]（task-37，drawer 退役）
 */
export function DecisionsView() {
  const router = useRouter();
  const t = useTranslations("portal.decisions");
  const { data, error, loading, refetch } =
    useApi<DecisionDto[]>("/api/decisions");
  const [newDrawerChip, setNewDrawerChip] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false); // Saved 次要筛选（F4）

  const { actionable, history } = groupDecisions(data ?? []);
  const shownActionable = savedOnly
    ? actionable.filter((d) => d.saved)
    : actionable;

  function handleCreated(id: string) {
    setNewDrawerChip(null);
    refetch();
    router.push(`/portal/decisions/${id}`);
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

      {/* Active decisions：API 四态（section 常驻）；Saved 次要筛选 toggle（§11 纯书签） */}
      <div className="sec">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div className="sec-h">Active decisions</div>
          <button
            type="button"
            className="ask-chip"
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly((s) => !s)}
            style={savedOnly ? { borderColor: "var(--p-ink)" } : undefined}
          >
            {t("savedOnly")}
          </button>
        </div>
        {loading ? (
          <Skeleton lines={3} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : shownActionable.length === 0 ? (
          <div className="cm2-note">
            {savedOnly && actionable.length > 0
              ? t("savedEmpty")
              : "Nothing being weighed right now — start one above."}
          </div>
        ) : (
          shownActionable.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onClick={() => router.push(`/portal/decisions/${d.id}`)}
            />
          ))
        )}
      </div>

      {/* Inside a decision（静态，设计稿） */}
      <div className="sec">
        <div className="sec-h">Inside a decision</div>
        <div className="card">
          <div
            style={{
              fontFamily: "var(--p-serif)",
              fontSize: 20,
              marginBottom: 10,
            }}
          >
            Should I do Thermage?
          </div>
          <div className="sub-row">
            <span>Clinic consultations</span>
            <span className="arr">2</span>
          </div>
          <div className="sub-row">
            <span>Products considered</span>
            <span className="arr">3</span>
          </div>
          <div className="sub-row">
            <span>Cost &amp; what&rsquo;s included</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row">
            <span>Concerns</span>
            <span className="arr">pain, cost, volume</span>
          </div>
          <div className="sub-row">
            <span>Related real journeys</span>
            <span className="arr">5</span>
          </div>
          <div className="sub-row">
            <span>Final decision &amp; follow-up</span>
            <span className="arr">&mdash;</span>
          </div>
        </div>
      </div>

      {/* Saved & completed：section 常驻，行数据来自 API */}
      <div className="sec">
        <div className="sec-h">Saved &amp; completed</div>
        {!loading && !error && history.length === 0 ? (
          <div className="cm2-note">Nothing saved or completed yet.</div>
        ) : (
          history.length > 0 && (
            <div className="card">
              {history.map((d) => (
                <div
                  key={d.id}
                  className="sub-row"
                  onClick={() => router.push(`/portal/decisions/${d.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/portal/decisions/${d.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <span>
                    {d.question} &middot;{" "}
                    {lifecycleToLabel(d.lifecycle).toLowerCase()}
                  </span>
                  <span className="arr">&rsaquo;</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {newDrawerChip !== null && (
        <NewDecisionDrawer
          chip={newDrawerChip}
          onClose={() => setNewDrawerChip(null)}
          onCreated={handleCreated}
        />
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
          <span className="dec-badge">
            {lifecycleToLabel(decision.lifecycle)}
          </span>
        </div>
        {decision.goal && (
          <div className="st">For: {goalToLabel(decision.goal)}</div>
        )}
        <div className="st">Updated {formatRelative(decision.updated)}</div>
        <div className="dcard-src">
          <span className="ds you">
            <i />
            You
          </span>
          <span className="ds sim">
            <i />
            Similar journeys
          </span>
          <span className="ds ev">
            <i />
            Evidence
          </span>
        </div>
      </div>
      <span className="arr dcard-arr" aria-hidden="true">
        &rsaquo;
      </span>
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
