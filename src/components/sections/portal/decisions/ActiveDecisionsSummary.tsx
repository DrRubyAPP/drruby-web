"use client";

import { Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { DecisionDto } from "./dto";
import { isActive, statusToLabel } from "./mappers";

interface ActiveDecisionsSummaryProps {
  /** 点击卡片 → 切到 v-decisions view（父组件回调）。 */
  onClick?: () => void;
}

/**
 * Today 视图里的 "Your active decisions" 预览卡：替换 portal/page.tsx
 * v-today 内 inline 段。
 * - GET /api/decisions → filter active → slice 3
 * - 空时整段返回 null（不留空壳，不污染 today 视图）
 * - 静默失败：error 时返回 null（today 视图不应被 decisions 错误打断）
 */
export function ActiveDecisionsSummary({
  onClick,
}: ActiveDecisionsSummaryProps) {
  const { data, error, loading } = useApi<DecisionDto[]>("/api/decisions");

  if (loading) return <Skeleton lines={3} />;
  if (error || !data) return null;

  const active = data.filter((d) => isActive(d.status)).slice(0, 3);
  if (active.length === 0) return null;

  return (
    <div className="sec">
      <div className="sec-h">Your active decisions</div>
      <div className="card">
        {active.map((d) => (
          <div
            key={d.id}
            className="dec"
            onClick={onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div>
              <h4>{d.question}</h4>
              <div className="st">
                Updated {new Date(d.updated).toLocaleDateString()}
              </div>
            </div>
            <span className="dec-badge">{statusToLabel(d.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
