"use client";

import { Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/i18n/navigation";
import type { DecisionDto } from "./dto";
import { isActionable } from "./mappers";

/**
 * Home "What matters now"（仅 actionable——History 行不进 WMN，F1/F5 Return 入口）。
 * 点击 → 路由到 /portal/decisions/[id]。
 * 空时整段返回 null（不留空壳）；静默失败：error 时返回 null。
 */
export function ActiveDecisionsSummary() {
  const router = useRouter();
  const { data, error, loading } = useApi<DecisionDto[]>("/api/decisions");

  if (loading) return <Skeleton lines={3} />;
  if (error || !data) return null;

  const saved = data.filter((d) => isActionable(d.lifecycle)).slice(0, 3); // 最近一个或短列表
  if (saved.length === 0) return null;

  return (
    <div className="sec">
      <div className="sec-h">What matters now</div>
      <div className="card">
        {saved.map((d) => (
          <div
            key={d.id}
            className="dec"
            onClick={() => router.push(`/portal/decisions/${d.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/portal/decisions/${d.id}`);
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
            <span className="dec-badge">Kept</span>
          </div>
        ))}
      </div>
    </div>
  );
}
