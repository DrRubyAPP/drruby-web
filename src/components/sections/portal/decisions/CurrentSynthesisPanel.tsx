"use client";

import { useTranslations } from "next-intl";
import { ErrorState, Skeleton } from "@/components/api";
import type { DecisionSnapshotDto } from "./dto";
import { isDegradedProvenance } from "./mappers";

/**
 * task-43 §15 Current 综合（T9）
 *
 * 渲染当前 Snapshot 的三视角 synthesis（Yourself / Others / Science）。
 * 受控组件：数据由父组件（DecisionDetailView）拉取后通过 props 分发，
 * 避免与 HistorySnapshotList 重复请求 /api/decisions/[id]/snapshots。
 *
 * - loading → Skeleton 骨架屏
 * - error → ErrorState + Retry（不伪装成"无证据"，§26）
 * - current=null（首次打开未 fire initial synthesis，R1）→ loading 占位
 * - synthesis=null（防御，理论不出现）→ empty 占位
 * - provenance=`template+llm_trigger_degraded` → 小字标注（R6 透明化，非报警）
 *
 * AI 五态状态徽章由 AiStateView 在本组件上方独立渲染（T11）。
 */
interface Props {
  current: DecisionSnapshotDto | null;
  loading: boolean;
  error: { message: string } | null;
  onRetry?: () => void;
}

const PERSPECTIVES = [
  { key: "yourself", field: "yourself" as const },
  { key: "others", field: "others" as const },
  { key: "science", field: "science" as const },
];

export function CurrentSynthesisPanel({
  current,
  loading,
  error,
  onRetry,
}: Props) {
  const t = useTranslations("decisions.snapshot");

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!current) {
    return (
      <div className="card">
        <p style={{ fontSize: 14, color: "#7c746f" }}>{t("loading")}</p>
      </div>
    );
  }

  const synth = current.synthesis;
  if (!synth) {
    return (
      <div className="card">
        <p style={{ fontSize: 14, color: "#7c746f" }}>{t("empty")}</p>
      </div>
    );
  }

  const degraded = isDegradedProvenance(current.provenance);

  return (
    <div className="card">
      <div className="sec-h">{t("currentTitle")}</div>
      {PERSPECTIVES.map((p) => (
        <div key={p.key} style={{ margin: "14px 0" }}>
          <b style={{ fontSize: 14 }}>{t(p.key)}</b>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              marginTop: 6,
              whiteSpace: "pre-wrap",
            }}
          >
            {synth[p.field]}
          </p>
        </div>
      ))}
      {degraded && (
        <div style={{ fontSize: 11, color: "#a89a95", marginTop: 8 }}>
          {t("degradedHint")}
        </div>
      )}
    </div>
  );
}
