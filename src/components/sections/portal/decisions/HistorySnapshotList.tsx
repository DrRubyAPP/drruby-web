"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/api";
import type { DecisionSnapshotDto } from "./dto";
import { isDegradedProvenance } from "./mappers";

/**
 * task-43 §15/§23 History Snapshot 列表（T9）
 *
 * 渲染历史 Snapshot（按 createdAt DESC，父组件已排序）。每条显示：
 * - trigger 人话原因：优先用 Snapshot.triggerHumanLabel（D1 LLM 生成）；
 *   缺失时回退 i18n key `decisions.snapshot.trigger.<trigger>`（不露原始 trigger 值）
 * - synthesis.combined 摘要（折叠态）
 * - 展开后显示 yourself/others/science 三段（"当时我知道什么"视图，§15）
 * - provenance=*_degraded → 小字标注（R6 历史也透明化）
 *
 * 受控组件：数据由父组件（DecisionDetailView）拉取后分发，
 * 与 CurrentSynthesisPanel 共用同一次 /api/decisions/[id]/snapshots 请求。
 */
interface Props {
  history: DecisionSnapshotDto[];
  loading: boolean;
  error: { message: string } | null;
  onRetry?: () => void;
}

const PERSPECTIVES = [
  { key: "yourself", field: "yourself" as const },
  { key: "others", field: "others" as const },
  { key: "science", field: "science" as const },
];

export function HistorySnapshotList({
  history,
  loading,
  error,
  onRetry,
}: Props) {
  const t = useTranslations("decisions.snapshot");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (loading) return <Skeleton lines={4} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (history.length === 0) {
    return (
      <div className="card">
        <p style={{ fontSize: 13, color: "#a89a95" }}>{t("historyEmpty")}</p>
      </div>
    );
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="card">
      <div className="sec-h">{t("historyTitle")}</div>
      {history.map((snap) => {
        const isOpen = expanded.has(snap.id);
        const triggerLabel =
          snap.triggerHumanLabel ?? t(`trigger.${snap.changeTrigger}`);
        const degraded = isDegradedProvenance(snap.provenance);
        const synth = snap.synthesis;
        return (
          <div
            key={snap.id}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#7c746f" }}>
                  {new Date(snap.createdAt).toLocaleDateString()}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#524d49",
                    marginTop: 2,
                  }}
                >
                  {triggerLabel}
                </div>
                {degraded && (
                  <div style={{ fontSize: 11, color: "#a89a95", marginTop: 4 }}>
                    {t("degradedHint")}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggle(snap.id)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  cursor: "pointer",
                  border: "1px solid var(--p-border)",
                  background: "transparent",
                  color: "var(--p-mid)",
                }}
                aria-expanded={isOpen}
              >
                {isOpen ? t("collapse") : t("expand")}
              </button>
            </div>
            {!isOpen && synth && (
              <p
                style={{
                  fontSize: 13,
                  color: "#7c746f",
                  marginTop: 6,
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {synth.combined}
              </p>
            )}
            {isOpen && synth && (
              <div style={{ marginTop: 10 }}>
                {PERSPECTIVES.map((p) => (
                  <div key={p.key} style={{ margin: "8px 0" }}>
                    <b style={{ fontSize: 13 }}>{t(p.key)}</b>
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        marginTop: 4,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {synth[p.field]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
