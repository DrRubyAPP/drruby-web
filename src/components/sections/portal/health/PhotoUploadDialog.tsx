"use client";

import imageCompression from "browser-image-compression";
import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError, apiClient } from "@/lib/api";
import type { HealthRecordKind } from "@/lib/db/enums";
import { ACTIVE_CHIP, LABEL, SUBMIT_BTN } from "../decisions/drawerStyles";

/** 照片仅接受 JPEG/PNG（HEIC 不支持，iOS 经 file input 会自动转 JPEG）。 */
const PHOTO_ACCEPT = "image/jpeg,image/png";
/** 原图硬上限（压缩前拦截，F8）。 */
const RAW_MAX_BYTES = 25 * 1024 * 1024;
/** 客户端压缩目标（F7）。 */
const COMPRESS_OPTS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1600,
  initialQuality: 0.82,
  useWebWorker: true,
};

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
  { value: "imaging", labelKey: "kindLabel.imaging" },
  { value: "symptom", labelKey: "kindLabel.symptom" },
  { value: "treatment", labelKey: "kindLabel.treatment" },
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

interface PhotoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** 上传成功回调（recordId 用于跳转 Review 页） */
  onUploaded: (recordId: string) => void;
}

/**
 * 照片上传弹层（task-46 F7）——从文档上传拆出的独立分支。
 * `capture="environment"` 移动端可调起拍照 / 图库；选图后本地预览；
 * 提交前 browser-image-compression 压缩（长边 ≤ 1600、质量 0.82、目标 ≤ 1.5MB），
 * 压缩失败降级原图上传并提示，不阻断流程。服务端仍按魔数二次校验。
 */
export function PhotoUploadDialog({
  open,
  onClose,
  onUploaded,
}: PhotoUploadDialogProps) {
  const t = useTranslations("myHealth");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<HealthRecordKind>("imaging");
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 组件卸载时释放最后一个 object URL，防内存泄漏
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  function clearPreview() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function reset() {
    setFile(null);
    clearPreview();
    setKind("imaging");
    setRecordedAt(new Date().toISOString().slice(0, 10));
    setSubmitting(false);
    setErrMsg(null);
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function close() {
    onClose();
    window.setTimeout(reset, 50);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setErrMsg(null);
    setNotice(null);
    clearPreview();
    if (!picked) {
      setFile(null);
      return;
    }
    // HEIC 明确不支持（人话提示）
    if (/heic|heif/i.test(picked.type) || /\.(heic|heif)$/i.test(picked.name)) {
      setErrMsg(t("photo.errHeic"));
      setFile(null);
      return;
    }
    // 原图硬上限（压缩前拦截）
    if (picked.size > RAW_MAX_BYTES) {
      setErrMsg(t("photo.errTooLarge"));
      setFile(null);
      return;
    }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function submit() {
    if (submitting || !file) return;
    setSubmitting(true);
    setErrMsg(null);
    setNotice(null);

    // 压缩：失败降级原图 + 提示，不阻断
    let toUpload = file;
    try {
      toUpload = await imageCompression(file, COMPRESS_OPTS);
    } catch {
      setNotice(t("photo.compressFailed"));
      toUpload = file;
    }

    try {
      const form = new FormData();
      form.append("file", toUpload, file.name);
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
          {t("photo.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("photo.intro")}
        </p>

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="photo-file">
          {t("photo.fileLabel")}
        </label>
        <input
          ref={fileInputRef}
          id="photo-file"
          type="file"
          accept={PHOTO_ACCEPT}
          capture="environment"
          onChange={onPick}
          style={INPUT_STYLE}
        />
        <div style={{ fontSize: 12, color: "#a89a95", marginTop: 6 }}>
          {t("photo.fileHint")}
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt={t("photo.previewAlt")}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: 240,
              marginTop: 12,
              objectFit: "contain",
              border: "1px solid #eee",
            }}
          />
        )}

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="photo-kind">
          {t("photo.kindLabel")}
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

        <label style={{ ...LABEL, marginTop: 14 }} htmlFor="photo-date">
          {t("photo.dateLabel")}
        </label>
        <input
          id="photo-date"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          style={INPUT_STYLE}
        />

        {notice && (
          <div style={{ color: "#8a6d3b", fontSize: 13, margin: "10px 0" }}>
            {notice}
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
            {t("photo.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !file}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {submitting ? t("photo.uploading") : t("photo.upload")}
          </button>
        </div>
      </div>
    </div>
  );
}
