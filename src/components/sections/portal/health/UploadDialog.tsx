"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useRef, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError, apiClient } from "@/lib/api";
import type { HealthRecordKind } from "@/lib/db/enums";
import { ACTIVE_CHIP, LABEL, SUBMIT_BTN } from "../decisions/drawerStyles";

/** 文档上传接受的类型（服务端仍按魔数二次校验，此处仅体验优化）。 */
const DOC_ACCEPT = "application/pdf,image/jpeg,image/png";
/** 文档大小上限（与服务端 DOC_MAX_BYTES 对齐，仅前端提示用）。 */
const DOC_MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  { value: "lab", labelKey: "kindLabel.lab" },
  { value: "imaging", labelKey: "kindLabel.imaging" },
  { value: "checkup", labelKey: "kindLabel.checkup" },
  { value: "vitals", labelKey: "kindLabel.vitals" },
  { value: "medication", labelKey: "kindLabel.medication" },
  { value: "symptom", labelKey: "kindLabel.symptom" },
  { value: "treatment", labelKey: "kindLabel.treatment" },
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

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** 上传成功回调（recordId 用于跳转 Review 页） */
  onUploaded: (recordId: string) => void;
}

/**
 * 文档上传弹层（Contract §2 V1 采集方式之二；照片走独立 PhotoUploadDialog）。
 * task-46：真实文件传输——`<input type="file">` + FormData（不再输文件名占位）。
 * 上传成功 → 服务端建 Source + Record（status=SOURCE_UPLOADED），
 * 前端通过 onUploaded(recordId) 跳转 Review 页触发抽取流程。
 */
export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  const t = useTranslations("myHealth");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<HealthRecordKind>("lab");
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setFile(null);
    setKind("lab");
    setRecordedAt(new Date().toISOString().slice(0, 10));
    setSubmitting(false);
    setErrMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function close() {
    onClose();
    window.setTimeout(reset, 50);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setErrMsg(null);
    // 前端体验拦截（服务端仍按魔数二次校验）
    if (picked && picked.size > DOC_MAX_BYTES) {
      setErrMsg(t("upload.errTooLarge"));
      setFile(null);
      return;
    }
    setFile(picked);
  }

  async function submit() {
    if (submitting) return;
    if (!file) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      form.append("recordedAt", new Date(recordedAt).toISOString());
      const res = await apiClient.postForm<{
        sourceId: string;
        recordId: string;
      }>("/api/health/sources", form);
      if (res?.recordId) {
        onUploaded(res.recordId);
      }
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
          {t("upload.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("upload.intro")}
        </p>

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="upload-file">
          {t("upload.fileLabel")}
        </label>
        <input
          ref={fileInputRef}
          id="upload-file"
          type="file"
          accept={DOC_ACCEPT}
          onChange={onPick}
          style={INPUT_STYLE}
        />
        <div style={{ fontSize: 12, color: "#a89a95", marginTop: 6 }}>
          {file
            ? `${file.name} · ${formatSize(file.size)}`
            : t("upload.fileHint")}
        </div>

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="upload-kind">
          {t("upload.kindLabel")}
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

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="upload-date">
          {t("upload.dateLabel")}
        </label>
        <input
          id="upload-date"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          style={INPUT_STYLE}
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
            {t("upload.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !file}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {submitting ? t("upload.uploading") : t("upload.upload")}
          </button>
        </div>
      </div>
    </div>
  );
}
