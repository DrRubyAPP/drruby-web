"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { ConnectToDecisionDialog } from "./ConnectToDecisionDialog";
import { CorrectRecordDialog } from "./CorrectRecordDialog";
import type { HealthRecordDto } from "./dto";
import {
  canConfirm,
  canRetry,
  confidenceKey,
  mapHealthRecord,
  needsConfirm,
  statusKey,
} from "./mappers";
import { RecordItem } from "./RecordItem";

const BTN_BASE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  padding: "10px 18px",
  cursor: "pointer",
  border: "1px solid var(--p-border)",
  background: "transparent",
  color: "var(--p-mid)",
};

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN_BASE,
  background: "var(--p-red)",
  color: "#fff",
  border: "none",
};

/**
 * C2/C3/C4 · 复核抽取结果（Contract §12/§13）。
 * - C2：逐条展示抽取结果，未识别项显式暴露（不静默丢弃）
 * - C3：From your report → 打开原件（V1 占位链接，不做定位/高亮）
 * - C4：Add to My Health 三态动作（Confirm / Mark for review / Retry）
 * - 抽取内容在用户确认前只作 Draft，绝不当作已确认事实
 * - 确认后状态变 CONFIRMED，隐藏推进按钮（避免重复状态机写入）
 * - task-48 D-9：SOURCE_UPLOADED 挂载自动触发抽取（POST trigger），
 *   PROCESSING 期间每 2s 轮询至终态；FAILED 显示错误 + 三条恢复路径
 *   （Retry / 重新上传 / 手动录入，F4）
 */
export function ReviewView({ recordId }: { recordId: string }) {
  const t = useTranslations("myHealth");
  const tr = useTranslations("records");
  const router = useRouter();
  const { data, error, loading, refetch } = useApi<HealthRecordDto>(
    `/api/health/records/${recordId}`,
  );

  // C6/C7：Correct + Connect 弹层状态
  const [correctOpen, setCorrectOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  // D-9：上传进入本页时 record 停在 SOURCE_UPLOADED —— 挂载自动触发一次抽取
  // （useRef 防重复；触发后 .finally(refetch) 让轮询看到 PROCESSING/终态）
  const triggered = useRef(false);
  useEffect(() => {
    if (data?.status !== "SOURCE_UPLOADED" || triggered.current) return;
    triggered.current = true;
    apiClient.post(`/api/health/records/${recordId}`).finally(refetch);
  }, [data?.status, recordId, refetch]);

  // D-9：PROCESSING 期间每 2s 轮询；到终态（EXTRACTED_DRAFT/FAILED）依赖变化自然清理
  useEffect(() => {
    if (data?.status !== "PROCESSING") return;
    const timer = setInterval(refetch, 2000);
    return () => clearInterval(timer);
  }, [data?.status, refetch]);

  const advance = useMutation(
    (status: "USER_REVIEW" | "CONFIRMED") =>
      apiClient.patch(`/api/health/records/${recordId}`, {
        action: "advance",
        status,
      }),
    { onSuccess: () => refetch() },
  );

  const retry = useMutation(
    (_input: void) => apiClient.post(`/api/health/records/${recordId}`),
    { onSuccess: () => refetch() },
  );

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data)
    return (
      <EmptyState title={tr("notFound.title")} hint={tr("notFound.hint")} />
    );

  const row = mapHealthRecord(data);
  const showActions = canConfirm(data.status);
  const recordNeedsConfirm = needsConfirm(data);

  return (
    <>
      <h1
        style={{
          fontFamily: "var(--p-serif)",
          fontWeight: 400,
          margin: "0 0 8px",
        }}
      >
        {t("review.title")}
      </h1>
      <p style={{ fontSize: 13.5, color: "#7c746f", marginBottom: 18 }}>
        {t("review.intro")}
      </p>

      {/* 上下文：title + status + confidence */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 400, margin: 0 }}>
          {data.title}
        </h2>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "#7c746f",
            }}
          >
            {tr(statusKey(data.status))}
          </span>
          {data.confidence && (
            <span
              style={{
                fontSize: 11,
                color: recordNeedsConfirm ? "#a87422" : "#7c746f",
              }}
            >
              {tr(confidenceKey(data.confidence))}
            </span>
          )}
        </div>
      </div>

      {/* C2: 逐条展示抽取结果 + 逐字段 Please confirm 标记（来自 DB，task-48 F3） */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="sec-h">{t("review.title")}</div>
        {row.items.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "#7c746f", padding: "8px 0" }}>
            {t("review.empty")}
          </p>
        ) : (
          row.items.map((item, i) => (
            <RecordItem
              key={`${item.name}-${i}`}
              item={item}
              needsConfirm={data.pleaseConfirm?.includes(item.name) ?? false}
            />
          ))
        )}
      </div>

      {/* C3: From your report → 打开原件（占位链接） */}
      {data.source?.objectKey && (
        <div style={{ marginBottom: 18 }}>
          <a
            href={data.source.objectKey}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: "var(--p-red)",
              textDecoration: "none",
            }}
          >
            {t("review.fromReport")} →
          </a>
          <span
            style={{
              fontSize: 11,
              color: "#a89a95",
              marginLeft: 8,
            }}
          >
            {data.source.fileName}
          </span>
        </div>
      )}

      {/* C4: Add to My Health 动作（按状态分流，task-48 补 PROCESSING/FAILED 态） */}
      {data.status === "CONFIRMED" ? (
        <div
          style={{
            padding: "14px 0",
            borderTop: "1px solid #eee",
            color: "#2f6b4f",
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          {t("review.confirmed")}
        </div>
      ) : data.status === "PROCESSING" ? (
        /* D-9：抽取进行中——轮询等终态，不显示任何动作 */
        <div
          style={{
            padding: "14px 0",
            borderTop: "1px solid #eee",
            color: "#7c746f",
            fontSize: 13.5,
          }}
        >
          {t("review.processing")}
        </div>
      ) : data.status === "FAILED" ? (
        /* F4：失败恢复三路径——Retry / 重新上传 / 手动录入（错误文案来自 DB） */
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="sec-h">{t("review.failedTitle")}</div>
          {data.error && (
            <p style={{ fontSize: 13.5, color: "#8C2635", padding: "8px 0" }}>
              {data.error}
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              padding: "10px 0",
            }}
          >
            <button
              type="button"
              onClick={() => retry.mutate(undefined)}
              disabled={retry.loading}
              style={BTN_PRIMARY}
              className="disabled:opacity-50"
            >
              {retry.loading ? t("review.retrying") : t("review.retry")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/portal")}
              style={BTN_BASE}
            >
              {t("review.reupload")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/portal")}
              style={BTN_BASE}
            >
              {t("review.manualEntry")}
            </button>
          </div>
          {retry.error && (
            <ErrorState
              message={retry.error.message}
              onRetry={() => retry.reset()}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            padding: "14px 0",
            borderTop: "1px solid #eee",
          }}
        >
          {showActions && (
            <>
              <button
                type="button"
                onClick={() => advance.mutate("CONFIRMED")}
                disabled={advance.loading}
                style={BTN_PRIMARY}
                className="disabled:opacity-50"
              >
                {advance.loading ? t("review.confirming") : t("review.confirm")}
              </button>
              <button
                type="button"
                onClick={() => advance.mutate("USER_REVIEW")}
                disabled={advance.loading}
                style={BTN_BASE}
                className="disabled:opacity-50"
              >
                {t("review.markForReview")}
              </button>
            </>
          )}
          {canRetry(data.status) && (
            <button
              type="button"
              onClick={() => retry.mutate(undefined)}
              disabled={retry.loading || advance.loading}
              style={BTN_BASE}
              className="disabled:opacity-50"
            >
              {retry.loading ? t("review.retrying") : t("review.retry")}
            </button>
          )}
          {advance.error && (
            <ErrorState
              message={advance.error.message}
              onRetry={() => advance.reset()}
            />
          )}
          {retry.error && (
            <ErrorState
              message={retry.error.message}
              onRetry={() => retry.reset()}
            />
          )}
        </div>
      )}

      {/* C7 · Correct this record（每条 record 可纠错 + provenance 轨迹；FAILED 走手输恢复） */}
      {(data.status === "EXTRACTED_DRAFT" ||
        data.status === "USER_REVIEW" ||
        data.status === "CONFIRMED") && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setCorrectOpen(true)}
            style={{
              fontSize: 12,
              color: "#7c746f",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t("review.correct")}
          </button>
        </div>
      )}

      {/* C6/F2 · Understand this result（Contract §2 + A9：点击本身不创建也不连接，
          仅打开三选一 dialog；与「是否存入 My Health」（Confirm）是两件独立的事） */}
      {data.status === "CONFIRMED" && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            style={BTN_PRIMARY}
          >
            {t("review.understand")}
          </button>
        </div>
      )}

      <CorrectRecordDialog
        record={data}
        open={correctOpen}
        onClose={() => setCorrectOpen(false)}
        onCorrected={() => refetch()}
      />
      <ConnectToDecisionDialog
        recordId={data.id}
        recordTitle={data.title}
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onDismissed={() => refetch()}
      />
    </>
  );
}
