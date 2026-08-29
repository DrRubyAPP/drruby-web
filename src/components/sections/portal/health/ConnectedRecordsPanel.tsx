"use client";

import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import type { DecisionHealthRecordDto } from "./dto";
import { mapConnectedRecords } from "./mappers";

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

/**
 * C9 · Decision 详情页 Connected Records 面板（Contract §2 显式 Connect 护栏）。
 * - 列出 active 关联（removedAt=null）；软删除留痕（removedAt）
 * - Yourself 引用组装：关联表为引用来源，不复制（B2 兼容：扁平 yourselfContext 仍作 fallback）
 * - Remove → DELETE /api/decisions/[id]/health-records?healthRecordId=X
 *   （软删除留痕：Decision 历史保留"该记录已被移除"痕迹）
 */
export function ConnectedRecordsPanel({ decisionId }: { decisionId: string }) {
  const t = useTranslations("myHealth");
  const { data, error, loading, refetch } = useApi<DecisionHealthRecordDto[]>(
    `/api/decisions/${decisionId}/health-records`,
  );

  async function remove(healthRecordId: string) {
    await apiClient.del(
      `/api/decisions/${decisionId}/health-records?healthRecordId=${healthRecordId}`,
    );
    refetch();
  }

  if (loading) return <Skeleton lines={2} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const rows = mapConnectedRecords(data ?? []);

  if (rows.length === 0) {
    return (
      <div className="card" style={{ marginTop: 14 }}>
        <div className="sec-h" style={{ fontSize: 13 }}>
          {t("connected.title")}
        </div>
        <EmptyState title={t("connected.empty")} hint={t("connect.intro")} />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="sec-h" style={{ fontSize: 13 }}>
        {t("connected.title")}
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
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
              {row.healthRecord.title}
            </div>
            <div style={{ fontSize: 11, color: "#a89a95", marginTop: 2 }}>
              {row.healthRecord.statusText} ·{" "}
              {new Date(row.connectedAt).toLocaleDateString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => remove(row.healthRecordId)}
            style={BTN_BASE}
          >
            {t("connected.remove")}
          </button>
        </div>
      ))}
    </div>
  );
}
