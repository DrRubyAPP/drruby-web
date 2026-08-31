"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 标题（动词短语，如 "Stop observing"） */
  title: string;
  /** 正文说明（后果/保留性提示） */
  message: string;
  /** 确认按钮文案 */
  confirmLabel: string;
  /** 确认进行中文案（loading 态）；不传则确认按钮仅禁用 */
  confirmingLabel?: string;
  /** 取消按钮文案 */
  cancelLabel: string;
  /** 确认请求进行中（禁用两个按钮） */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 通用确认弹窗：替代 window.confirm 的轻量受控组件。
 * - Esc / 点遮罩 = 取消；确认进行中禁用全部入口
 * - 视觉对齐 portal 抽屉系（--p-red / --p-border / --p-serif）
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Esc 关闭（确认中不允许 Esc 逃逸，避免歧义）
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "26px 28px",
          width: "min(440px, 100vw)",
          boxSizing: "border-box",
          boxShadow: "0 24px 60px rgba(57, 38, 30, 0.18)",
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 10,
            fontFamily: "var(--p-serif)",
            fontSize: 21,
            fontWeight: 500,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#6f6762",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid var(--p-border)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6f6762",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: "var(--p-red)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading && confirmingLabel ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
