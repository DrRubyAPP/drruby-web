"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";

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
  maxWidth: 480,
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
};

interface ContributeDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Library "Contribute a journey anonymously" 弹窗表单：
 * - title/description 必填 + shared 复选（默认 false，意为愿意审核后公开）
 * - POST /api/contributions；成功 → 组件内成功态（Done 关闭）
 * - 贡献为用户私有记录，Library 不直接可见（审核转 Journey 是后续链路）
 */
export function ContributeDialog({ open, onClose }: ContributeDialogProps) {
  const t = useTranslations("portal.library");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setTitle("");
    setDescription("");
    setShared(false);
    setSubmitting(false);
    setDone(false);
    setErrMsg(null);
  }

  function close() {
    onClose();
    // 等 DOM 移除后再复位，避免成功态闪烁
    window.setTimeout(reset, 50);
  }

  async function submit() {
    if (submitting) return;
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      await apiClient.post("/api/contributions", {
        title: title.trim(),
        description: description.trim(),
        shared,
      });
      setDone(true);
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
          {t("contribute.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("contribute.intro")}
        </p>

        {done ? (
          <>
            <div
              style={{
                fontSize: 14.5,
                color: "#2f6b4f",
                fontWeight: 600,
                margin: "18px 0 6px",
              }}
            >
              {t("contribute.success")}
            </div>
            <div style={{ fontSize: 12.5, color: "#a89a95", marginBottom: 16 }}>
              {t("contribute.successHint")}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={close}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-white bg-dr-red border-none px-5 py-2.5 cursor-pointer"
              >
                {t("contribute.done")}
              </button>
            </div>
          </>
        ) : (
          <>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "#7c746f",
                margin: "14px 0 6px",
              }}
            >
              {t("contribute.titleLabel")}
              <input
                type="text"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("contribute.titlePlaceholder")}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 6,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  fontSize: 14,
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: "normal",
                  fontFamily: "inherit",
                }}
              />
            </label>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "#7c746f",
                margin: "14px 0 6px",
              }}
            >
              {t("contribute.descriptionLabel")}
              <textarea
                value={description}
                maxLength={2000}
                rows={5}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("contribute.descriptionPlaceholder")}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 6,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  fontSize: 14,
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: "normal",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 13,
                lineHeight: 1.5,
                margin: "14px 0 4px",
                cursor: "pointer",
                color: "#524d49",
              }}
            >
              <input
                type="checkbox"
                checked={shared}
                onChange={(e) => setShared(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>{t("contribute.sharedLabel")}</span>
            </label>

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
                {t("contribute.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !title.trim() || !description.trim()}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-white bg-dr-red border-none px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? t("contribute.submitting")
                  : t("contribute.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
