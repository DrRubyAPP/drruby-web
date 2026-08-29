"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useApi } from "@/hooks/useApi";
import { ApiError, apiClient } from "@/lib/api";
import { SUBMIT_BTN } from "../decisions/drawerStyles";
import type { DecisionDto } from "../decisions/dto";

const CENTER_OVERLAY: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16,
};

const CENTER_MODAL: CSSProperties = {
  background: "#fff",
  padding: 24,
  maxWidth: 520,
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
  maxHeight: "90vh",
  overflowY: "auto",
};

interface ConnectToDecisionDialogProps {
  recordId: string;
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

/**
 * C6 · Connect to a decision（Contract §2 核心护栏）。
 * Record 进 My Health ≠ 自动进 Decision；仅用户显式 Connect 才进该 Decision 的 Yourself。
 * yourselfContext 扁平字符串保留作 fallback（B2）；关联表为引用来源。
 * Connect 属 meaningful activity → 服务端刷 Decision.lastUserActivityAt（§8）。
 */
export function ConnectToDecisionDialog({
  recordId,
  open,
  onClose,
  onConnected,
}: ConnectToDecisionDialogProps) {
  const t = useTranslations("myHealth");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { data: decisions, loading } = useApi<DecisionDto[]>("/api/decisions");

  if (!open) return null;

  function close() {
    setDecisionId(null);
    setSubmitting(false);
    setErrMsg(null);
    onClose();
  }

  async function connect() {
    if (!decisionId || submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      await apiClient.post(`/api/decisions/${decisionId}/health-records`, {
        healthRecordId: recordId,
      });
      onConnected?.();
      close();
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      if (err.status !== 401) setErrMsg(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={CENTER_OVERLAY}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) close();
      }}
    >
      <div style={CENTER_MODAL}>
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: "var(--p-serif)",
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          {t("connect.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("connect.intro")}
        </p>

        {loading ? (
          <p style={{ fontSize: 13, color: "#a89a95", padding: "14px 0" }}>
            Loading…
          </p>
        ) : !decisions || decisions.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a89a95", padding: "14px 0" }}>
            {t("connect.empty")}
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            {decisions.map((d) => (
              <label
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "10px 0",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#524d49",
                }}
              >
                <input
                  type="radio"
                  name="connect-decision"
                  checked={decisionId === d.id}
                  onChange={() => setDecisionId(d.id)}
                  style={{ marginTop: 3 }}
                />
                <span>{d.question}</span>
              </label>
            ))}
          </div>
        )}

        {errMsg && (
          <div style={{ color: "#8C2635", fontSize: 13, margin: "10px 0" }}>
            {errMsg}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="text-[12px] font-bold tracking-[0.16em] uppercase text-dr-mid border border-dr-border px-5 py-2.5 cursor-pointer disabled:opacity-50"
          >
            {t("connect.cancel")}
          </button>
          <button
            type="button"
            onClick={connect}
            disabled={submitting || !decisionId}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {submitting ? t("connect.connecting") : t("connect.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
