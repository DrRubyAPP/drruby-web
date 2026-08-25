"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { Skeleton } from "@/components/api/Skeleton";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api/client";

interface JourneyDto {
  id: string;
  decisionType: string | null;
  goal: string | null;
  concern: string | null;
  timingContext: string | null;
  summary: string;
  outcome: string | null;
  sourceType: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface JourneyDetailDto extends JourneyDto {
  updates: { id: string; version: number; note: string; createdAt: string }[];
}

/** 标题：decisionType 首字母大写，缺省回退 goal / 概要前几个词 */
export function journeyTitle(j: JourneyDto): string {
  const raw = j.decisionType ?? j.goal;
  if (raw) return raw.charAt(0).toUpperCase() + raw.slice(1);
  return j.summary.split(/\s+/).slice(0, 4).join(" ");
}

/**
 * Library "Living journeys" 区块：
 * - GET /api/journeys 列表（loading/error/empty/data 四态）
 * - 点击卡片 → GET /api/journeys/[id] inline 展开详情（goal/concern/timing/outcome + updates 时间线）
 * - 再次点击收起；详情按 id 缓存，展开不重复请求
 */
export function LibraryJourneys() {
  const t = useTranslations("portal.library");
  const { data, error, loading, refetch } = useApi<JourneyDto[]>(
    "/api/journeys",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, JourneyDetailDto>>({});
  const [detailError, setDetailError] = useState(false);

  async function toggle(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setDetailError(false);
    if (!details[id]) {
      try {
        const detail = await apiClient.get<JourneyDetailDto>(
          `/api/journeys/${id}`,
        );
        setDetails((prev) => ({ ...prev, [id]: detail }));
      } catch {
        setDetailError(true);
      }
    }
  }

  if (loading) {
    return (
      <div className="card">
        <Skeleton lines={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <ErrorState message={t("journeys.error")} onRetry={refetch} />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="cm2-note">{t("journeys.empty")}</div>
      </div>
    );
  }

  return (
    <div className="card">
      {data.map((j) => {
        const expanded = expandedId === j.id;
        const detail = details[j.id];
        return (
          <div key={j.id}>
            <div
              className="cm2-q"
              style={{ cursor: "pointer" }}
              onClick={() => toggle(j.id)}
            >
              <div className="cm2-qt">{journeyTitle(j)}</div>
              <div className="cm2-qmeta">
                {t(`sourceType.${j.sourceType}`)} ·{" "}
                {t("journeys.updated", {
                  date: new Date(j.updatedAt).toLocaleDateString(),
                })}
              </div>
              <div style={{ fontSize: 13.5, color: "#524d49", marginTop: 6 }}>
                {j.summary}
              </div>
            </div>

            {expanded && (
              <div
                style={{
                  padding: "10px 14px 14px",
                  borderBottom: "1px solid var(--p-line, #eee)",
                  fontSize: 13.5,
                  color: "#524d49",
                  lineHeight: 1.65,
                }}
              >
                {detailError && (
                  <div style={{ color: "#8C2635" }}>{t("journeys.error")}</div>
                )}
                {!detailError && !detail && <div>…</div>}
                {detail && (
                  <>
                    <div>
                      <b>{t("journeys.detailGoal")}:</b> {detail.goal ?? "—"}
                      　<b>{t("journeys.detailConcern")}:</b>{" "}
                      {detail.concern ?? "—"}
                    </div>
                    {detail.timingContext && (
                      <div>
                        <b>{t("journeys.detailTiming")}:</b>{" "}
                        {detail.timingContext}
                      </div>
                    )}
                    {detail.outcome && (
                      <div>
                        <b>{t("journeys.detailOutcome")}:</b>{" "}
                        {t(`outcome.${detail.outcome}`)}
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontWeight: 600 }}>
                      {t("journeys.updates")}
                    </div>
                    {detail.updates.length === 0 ? (
                      <div>{t("journeys.noUpdates")}</div>
                    ) : (
                      detail.updates.map((u) => (
                        <div key={u.id} style={{ display: "flex", gap: 8 }}>
                          <span
                            style={{
                              flexShrink: 0,
                              color: "#a89a95",
                              fontSize: 12.5,
                              minWidth: 92,
                              paddingTop: 2,
                            }}
                          >
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                          <span>{u.note}</span>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
