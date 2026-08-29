"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError, apiClient } from "@/lib/api";
import type { HealthRecordKind } from "@/lib/db/enums";
import {
  ACTIVE_CHIP,
  LABEL,
  SUBMIT_BTN,
  TEXTAREA,
} from "../decisions/drawerStyles";

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
  maxHeight: "90vh",
  overflowY: "auto",
};

const KIND_OPTIONS: { value: HealthRecordKind; labelKey: string }[] = [
  { value: "medication", labelKey: "kindLabel.medication" },
  { value: "symptom", labelKey: "kindLabel.symptom" },
  { value: "treatment", labelKey: "kindLabel.treatment" },
  { value: "vitals", labelKey: "kindLabel.vitals" },
  { value: "lab", labelKey: "kindLabel.lab" },
  { value: "imaging", labelKey: "kindLabel.imaging" },
  { value: "checkup", labelKey: "kindLabel.checkup" },
];

const INPUT_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "10px 12px",
  border: "1px solid #ddd",
  fontSize: 14,
  fontWeight: 400,
  fontFamily: "inherit",
};

interface LogFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * 手动录入表单（Contract §2 V1 采集方式之一）。
 * 直接生成 CONFIRMED 记录（不走 Extractor；§12 状态机起点=SOURCE_UPLOADED,
 * manual log 跳过抽取直接到 CONFIRMED）。
 * 成功 → onSaved（父组件关闭弹层 + 刷新）。
 */
export function LogForm({ open, onClose, onSaved }: LogFormProps) {
  const t = useTranslations("myHealth");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<HealthRecordKind>("medication");
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setTitle("");
    setKind("medication");
    setRecordedAt(new Date().toISOString().slice(0, 10));
    setValue("");
    setNotes("");
    setSubmitting(false);
    setErrMsg(null);
  }

  function close() {
    onClose();
    window.setTimeout(reset, 50);
  }

  async function submit() {
    if (submitting) return;
    if (!title.trim()) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      // manual log → parsedValues 自由形态：value/notes 收进 items 一条 + notes 字段
      const parsedValues = {
        items: [
          {
            name: title.trim(),
            value: value.trim() || undefined,
          },
        ],
        notes: notes.trim() || undefined,
      };
      await apiClient.post("/api/health/records", {
        kind,
        title: title.trim(),
        parsedValues,
        recordedAt: new Date(recordedAt).toISOString(),
      });
      onSaved();
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
          {t("log.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("log.intro")}
        </p>

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="log-title">
          {t("log.titleLabel")}
        </label>
        <input
          id="log-title"
          type="text"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("log.titlePlaceholder")}
          style={INPUT_STYLE}
        />

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="log-kind">
          {t("log.kindLabel")}
        </label>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}
        >
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className="ask-chip"
              style={kind === opt.value ? ACTIVE_CHIP : undefined}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="log-date">
          {t("log.dateLabel")}
        </label>
        <input
          id="log-date"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          style={INPUT_STYLE}
        />

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="log-value">
          {t("log.valueLabel")}
        </label>
        <input
          id="log-value"
          type="text"
          value={value}
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("log.valuePlaceholder")}
          style={INPUT_STYLE}
        />

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="log-notes">
          {t("log.notesLabel")}
        </label>
        <textarea
          id="log-notes"
          value={notes}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
          style={TEXTAREA}
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
            {t("log.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !title.trim()}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {submitting ? t("log.saving") : t("log.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
