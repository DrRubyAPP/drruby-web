"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { AgingMetricDto, AttentionDto, RefreshResponse } from "./dto";
import { mapAging, mapAttention } from "./mappers";

/** 本次浏览器会话内是否已自动 refresh 过——避免每次切回 today 都调 LLM。 */
let refreshedThisSession = false;

interface TodayViewProps {
  /** "See all your body signals →" 链接的回调（父组件切到 health 视图）。 */
  onSeeAllSignals?: () => void;
}

/**
 * Today 视图的"What deserves your attention today?" sec：
 * - 首次挂载 OR GET 后两端点都空 → 自动 POST /api/insights/refresh，串行后 GET
 * - attention / aging 各自独立 loading/error/empty/data 四态
 * - refresh 失败：GET 也失败 → 全 ErrorState；GET 有旧数据 → 顶部小条重试
 */
export function TodayView({ onSeeAllSignals }: TodayViewProps) {
  const attention = useApi<AttentionDto[]>("/api/insights/attention");
  const aging = useApi<AgingMetricDto[]>("/api/insights/aging-velocity");

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await apiClient.post<RefreshResponse>("/api/insights/refresh");
      refreshedThisSession = true;
      attention.refetch();
      aging.refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      setRefreshError(msg);
    } finally {
      setRefreshing(false);
    }
  }, [attention, aging]);

  // 挂载时：首次会话 → 直接 refresh+GET（串行）；否则仅 GET（useApi 自动跑），
  // 等 GET 回来后若两端点都空再 refresh（见下方 effect）。
  useEffect(() => {
    if (refreshedThisSession) return;
    runRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 非首次挂载 + GET 完成 + 两端点都空 → 自动 refresh 一次
  const bothEmpty =
    !attention.loading &&
    !aging.loading &&
    attention.error === null &&
    aging.error === null &&
    (attention.data ?? []).length === 0 &&
    (aging.data ?? []).length === 0;

  useEffect(() => {
    if (
      !refreshedThisSession &&
      bothEmpty &&
      !refreshing &&
      refreshError === null
    ) {
      runRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothEmpty, refreshing, refreshError]);

  const attentionCards = mapAttention(attention.data ?? []);
  const agingRows = mapAging(aging.data ?? []);

  const refreshFailedWithOldData =
    refreshError !== null && (attention.data !== null || aging.data !== null);

  return (
    <div className="sec">
      <div className="sec-h">What deserves your attention today?</div>

      {/* refresh 失败但有旧数据：顶部小条重试 */}
      {refreshFailedWithOldData && (
        <div
          style={{
            fontSize: 12.5,
            color: "#8C2635",
            background: "#fbeef0",
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Couldn&rsquo;t refresh insights. Showing last saved.</span>
          <button
            type="button"
            onClick={runRefresh}
            disabled={refreshing}
            style={{
              background: "transparent",
              border: "none",
              color: "#8C2635",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* refresh 进行中 + 暂无数据 → 整块 Skeleton（覆盖 attention+aging） */}
      {refreshing && attention.data === null && aging.data === null ? (
        <Skeleton lines={4} />
      ) : (
        <>
          {/* ===== Attention 卡片列表 ===== */}
          {attention.loading ? (
            <Skeleton lines={3} />
          ) : attention.error ? (
            <ErrorState
              message={attention.error.message}
              onRetry={attention.refetch}
            />
          ) : attentionCards.length === 0 ? (
            <EmptyState
              title="No attention cards yet"
              hint="Your insights will appear here after your first signals are recorded."
            />
          ) : (
            <>
              {attentionCards.map((c, i) => (
                <div
                  key={c.id}
                  className={`card matter${i === 0 ? " mn-primary" : ""}`}
                >
                  {c.tag && <div className="mn-tag">{c.tag}</div>}
                  <h3>{c.title}</h3>
                  {c.hasBody && <p>{c.body}</p>}
                </div>
              ))}
              {onSeeAllSignals && (
                <div className="mn-see" onClick={onSeeAllSignals}>
                  See all your body signals &rarr;
                </div>
              )}
            </>
          )}

          {/* ===== Aging velocity 指标条 ===== */}
          <div className="sec-h" style={{ marginTop: 24 }}>
            Your aging velocity
          </div>
          {aging.loading ? (
            <Skeleton lines={2} />
          ) : aging.error ? (
            <ErrorState message={aging.error.message} onRetry={aging.refetch} />
          ) : agingRows.length === 0 ? (
            <EmptyState
              title="No aging metrics yet"
              hint="Aging-velocity metrics will appear here once enough signals are recorded."
            />
          ) : (
            <div className="card">
              {agingRows.map((r) => (
                <div className="lab-row" key={r.id}>
                  <div className="lab-name">{r.label}</div>
                  <div className="lab-val">{r.value}</div>
                  <span className={`conf ${toneToConfClass(r.tone)}`}>
                    {r.tone}
                  </span>
                  {r.hasCaption && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#a89a95",
                        width: "100%",
                      }}
                    >
                      {r.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** tone 枚举 → 现有 .conf 修饰 class（green→pos, amber→obs-ish, purple→no）。
 *  复用 portal.css 已有 conf/pos/obs/no 配色，避免新增 CSS。 */
function toneToConfClass(tone: "green" | "amber" | "purple"): string {
  switch (tone) {
    case "green":
      return "pos";
    case "amber":
      return "obs";
    case "purple":
      return "no";
  }
}
