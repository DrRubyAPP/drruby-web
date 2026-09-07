"use client";

import { useTranslations } from "next-intl";
import { useApi } from "@/hooks/useApi";
import { type DecisionRef, isRelevant } from "@/lib/ai/synthesis/relevance";
import { apiClient } from "@/lib/api/client";
import type { DecisionHealthRecordDto, HealthRecordDto } from "../health/dto";

const BTN_BASE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "6px 12px",
  cursor: "pointer",
  border: "1px solid var(--p-border)",
  background: "transparent",
  color: "var(--p-mid)",
};

interface RelevantRecordsPanelProps {
  decisionId: string;
  decision: DecisionRef;
}

/**
 * F4 · Relevant from My Health（Contract §2 建议侧 + D-3）。
 * - 复用 isRelevant 纯函数（task-43 D2 规则匹配，不依赖 LLM）
 * - 仅 CONFIRMED 且未软删（列表端点已过滤 deletedAt）的 Record 参与匹配
 * - 排除已连接（active links）的 Record
 * - 仅建议，绝不自动连接（§2 护栏）；一键 Connect 走现有连接端点
 * - 无建议 → 整个面板不渲染（空态隐藏，非空文案）
 */
export function RelevantRecordsPanel({
  decisionId,
  decision,
}: RelevantRecordsPanelProps) {
  const t = useTranslations("myHealth");
  const records = useApi<HealthRecordDto[]>("/api/health/records");
  const links = useApi<DecisionHealthRecordDto[]>(
    `/api/decisions/${decisionId}/health-records`,
  );

  if (records.loading || links.loading) return null;

  const connectedIds = new Set((links.data ?? []).map((l) => l.healthRecordId));
  // summary 沿用 orchestrator 的 V1 约定：title 作 summary
  const suggestions = (records.data ?? [])
    .filter((r) => r.status === "CONFIRMED")
    .filter((r) => !connectedIds.has(r.id))
    .filter((r) =>
      isRelevant(
        {
          id: r.id,
          kind: r.kind,
          documentClass: r.documentClass,
          summary: r.title,
        },
        decision,
      ),
    );

  if (suggestions.length === 0) return null;

  async function connect(recordId: string) {
    await apiClient.post(`/api/decisions/${decisionId}/health-records`, {
      healthRecordId: recordId,
    });
    records.refetch();
    links.refetch();
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="sec-h" style={{ fontSize: 13 }}>
        {t("relevant.title")}
      </div>
      {suggestions.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#524d49",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.title}
            </div>
            <div style={{ fontSize: 11, color: "#a89a95", marginTop: 2 }}>
              {t(`kindLabel.${r.kind}`)}
            </div>
          </div>
          <button type="button" onClick={() => connect(r.id)} style={BTN_BASE}>
            {t("relevant.connect")}
          </button>
        </div>
      ))}
    </div>
  );
}
