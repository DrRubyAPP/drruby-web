"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useMemo, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError, apiClient } from "@/lib/api";
import { LABEL, SUBMIT_BTN, TEXTAREA } from "../decisions/drawerStyles";
import type { HealthRecordDto } from "./dto";

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
  maxWidth: 560,
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
  maxHeight: "90vh",
  overflowY: "auto",
};

interface CorrectRecordDialogProps {
  record: HealthRecordDto;
  open: boolean;
  onClose: () => void;
  onCorrected?: () => void;
}

/**
 * C7 · Correct this record + provenance 轨迹（Contract §14）。
 * - 修正**不静默覆盖**原始提取/provenance：每次修正追加 HealthRecordRevision
 * - Current Record（parsedValues）反映修正后事实，但系统能追溯来源 + 修正历史
 * - 展示 provenance 轨迹（原始来源/原抽取/修正值/修正人·时间）
 *
 * V1 编辑形式：parsedValues 以 JSON 文本域展示（task-43 接入真实字段级编辑）。
 */
export function CorrectRecordDialog({
  record,
  open,
  onClose,
  onCorrected,
}: CorrectRecordDialogProps) {
  const t = useTranslations("myHealth");
  const initialValues = useMemo(
    () => JSON.stringify(record.parsedValues ?? { items: [] }, null, 2),
    [record.parsedValues],
  );
  const [valuesText, setValuesText] = useState(initialValues);
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    setValuesText(initialValues);
    setSummary("");
    setSubmitting(false);
    setErrMsg(null);
    onClose();
  }

  async function save() {
    if (submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    let parsedValues: unknown;
    try {
      parsedValues = JSON.parse(valuesText);
    } catch {
      setErrMsg("Invalid JSON in corrected values");
      setSubmitting(false);
      return;
    }
    try {
      await apiClient.patch(`/api/health/records/${record.id}`, {
        action: "correct",
        parsedValues,
        diffSummary: summary.trim() || undefined,
      });
      onCorrected?.();
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
          {t("correct.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("correct.intro")}
        </p>

        {/* provenance 轨迹：修正历史 */}
        <div style={{ marginTop: 16, padding: 12, background: "var(--p-off)" }}>
          <div style={LABEL}>{t("provenance.title")}</div>
          {!record.revisions || record.revisions.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "#a89a95", margin: 0 }}>
              {t("provenance.empty")}
            </p>
          ) : (
            record.revisions.map((r) => (
              <div
                key={r.id}
                style={{
                  fontSize: 12.5,
                  color: "#524d49",
                  padding: "6px 0",
                  borderBottom: "1px solid #e8e0d8",
                }}
              >
                <div>{r.diffSummary ?? ""}</div>
                <div style={{ color: "#a89a95", fontSize: 11 }}>
                  {t("provenance.correctedBy", { by: r.correctedBy })} ·{" "}
                  {t("provenance.correctedAt", {
                    at: new Date(r.correctedAt).toLocaleString(),
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <label style={{ ...LABEL, marginTop: 16 }} htmlFor="correct-values">
          {t("correct.valuesLabel")}
        </label>
        <textarea
          id="correct-values"
          value={valuesText}
          rows={8}
          onChange={(e) => setValuesText(e.target.value)}
          style={TEXTAREA}
          spellCheck={false}
        />

        <label style={{ ...LABEL, marginTop: 8 }} htmlFor="correct-summary">
          {t("correct.summaryLabel")}
        </label>
        <input
          id="correct-summary"
          type="text"
          value={summary}
          maxLength={200}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("correct.summaryPlaceholder")}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            padding: "10px 12px",
            border: "1px solid #ddd",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />

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
            {t("correct.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={submitting}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {submitting ? t("correct.saving") : t("correct.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
