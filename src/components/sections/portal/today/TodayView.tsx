"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { AttentionDto, RefreshResponse } from "./dto";
import { mapAttention } from "./mappers";

/** 本次浏览器会话内是否已自动 refresh 过——避免每次切回 today 都调 LLM。 */
let refreshedThisSession = false;

interface TodayViewProps {
  /** "See all your body signals →" 链接的回调（父组件切到 health 视图）。 */
  onSeeAllSignals?: () => void;
}

/**
 * Today 视图的 "What matters now" sec：
 * - 首次挂载 OR GET 后为空 → 自动 POST /api/insights/refresh，串行后 GET
 * - attention 独立 loading/error/empty/data 四态
 * - refresh 失败：GET 也失败 → 全 ErrorState；GET 有旧数据 → 顶部小条重试
 */
export function TodayView({ onSeeAllSignals }: TodayViewProps) {
  const attention = useApi<AttentionDto[]>("/api/insights/attention");

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await apiClient.post<RefreshResponse>("/api/insights/refresh");
      refreshedThisSession = true;
      attention.refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      setRefreshError(msg);
    } finally {
      setRefreshing(false);
    }
  }, [attention]);

  // 挂载时：首次会话 → 直接 refresh+GET（串行）；否则仅 GET（useApi 自动跑），
  // 等 GET 回来后若为空再 refresh（见下方 effect）。
  useEffect(() => {
    if (refreshedThisSession) return;
    runRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 非首次挂载 + GET 完成 + 空 → 自动 refresh 一次
  const isEmpty =
    !attention.loading &&
    attention.error === null &&
    (attention.data ?? []).length === 0;

  useEffect(() => {
    if (
      !refreshedThisSession &&
      isEmpty &&
      !refreshing &&
      refreshError === null
    ) {
      runRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, refreshing, refreshError]);

  const attentionCards = mapAttention(attention.data ?? []);

  const refreshFailedWithOldData =
    refreshError !== null && attention.data !== null;

  return (
    <div className="sec">
      <div className="sec-h">What matters now</div>

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

      {/* refresh 进行中 + 暂无数据 → 整块 Skeleton */}
      {refreshing && attention.data === null ? (
        <Skeleton lines={4} />
      ) : attention.loading ? (
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
    </div>
  );
}
