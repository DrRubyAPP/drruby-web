"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import { clearBearerToken } from "@/lib/auth/token";

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

/**
 * Settings 注销账号岛：触发按钮 + 二次确认模态。
 * - 醒目不可逆红字警示（软删脱敏、无法恢复）
 * - 「我理解此操作不可逆」复选框，未勾选时确认按钮禁用
 * - 确认 → POST /api/me/delete；成功 → clearBearerToken() + 跳 /login
 * - 失败（非 401）→ 弹窗内统一错误文案，可重试；401 走既有跳转
 * - 取消 / Esc / 点遮罩关闭并复位
 */
export function DeleteAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ack, setAck] = useState(false);

  const del = useMutation<void, { deleted: true }>(
    () => apiClient.post<{ deleted: true }>("/api/me/delete"),
    {
      onSuccess: () => {
        clearBearerToken();
        router.push("/login");
      },
    },
  );

  function close() {
    setOpen(false);
    setAck(false);
    del.reset();
  }

  function confirm() {
    if (!ack || del.loading) return;
    del.mutate(undefined as never);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="sub-row" style={{ cursor: "pointer" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
            color: "inherit",
            textAlign: "left",
            flex: 1,
            cursor: "pointer",
          }}
        >
          <div className="sr2">
            <b>Delete my history or account</b>
            <span>Remove your data, any time.</span>
          </div>
        </button>
        <span className="arr">&rsaquo;</span>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={CENTER_OVERLAY}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
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
              Delete your account?
            </h3>
            <p
              className="text-dr-red"
              style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}
            >
              This is irreversible. Your account will be closed and your name
              and email permanently anonymised. This cannot be recovered.
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 13,
                lineHeight: 1.5,
                marginBottom: 16,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                I understand this action is permanent and irreversible.
              </span>
            </label>

            {del.error && (
              <div style={{ marginBottom: 16 }}>
                <ErrorState message={toErrorMessage(del.error)} />
              </div>
            )}

            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={close}
                disabled={del.loading}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-dr-mid border border-dr-border px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!ack || del.loading}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-white bg-dr-red border-none px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                {del.loading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
