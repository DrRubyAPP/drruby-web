"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";
import { ErrorState } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { ContributionDto, UpdateContributionResponse } from "./dto";

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
  maxWidth: 440,
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
};

const CANCEL_BTN: CSSProperties = {
  background: "transparent",
  color: "var(--p-mid)",
  border: "1px solid var(--p-border)",
  padding: "10px 20px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const CONFIRM_BTN: CSSProperties = {
  background: "var(--p-red)",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

interface WithdrawContributionDialogProps {
  contribution: ContributionDto;
  onClose: () => void;
  onWithdrawn: () => void;
}

/**
 * 撤回数据贡献二次确认模态：由 PrivacyView 的 "Withdraw" 按钮触发。
 * - 居中模态 + Cancel / Confirm
 * - Confirm → POST /api/contributions/{id} body { shared: false }
 * - onSuccess → onWithdrawn()（父级 refetch + 关弹窗）
 * - 错误态：inline ErrorState
 * - 关闭：Esc / 点遮罩 / Cancel
 */
export function WithdrawContributionDialog({
  contribution,
  onClose,
  onWithdrawn,
}: WithdrawContributionDialogProps) {
  const withdraw = useMutation(
    () =>
      apiClient.post<UpdateContributionResponse>(
        `/api/contributions/${contribution.id}`,
        { shared: false },
      ),
    { onSuccess: () => onWithdrawn() },
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleConfirm() {
    if (withdraw.loading) return;
    withdraw.mutate(undefined as never);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={CENTER_OVERLAY}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={CENTER_MODAL}>
        <h3
          style={{
            margin: 0,
            marginBottom: 12,
            fontFamily: "var(--p-serif)",
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          Withdraw contribution?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "var(--p-ink)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Are you sure you want to withdraw <b>{contribution.title}</b>? Your
          data will no longer be included in this contribution stream. You can
          opt back in any time.
        </p>

        {withdraw.error && (
          <div style={{ marginBottom: 16 }}>
            <ErrorState
              message={withdraw.error.message}
              onRetry={() => withdraw.reset()}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={withdraw.loading}
            style={{
              ...CANCEL_BTN,
              opacity: withdraw.loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={withdraw.loading}
            style={{
              ...CONFIRM_BTN,
              opacity: withdraw.loading ? 0.7 : 1,
            }}
          >
            {withdraw.loading ? "Withdrawing…" : "Yes, withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
