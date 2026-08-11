"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import {
  type CreateHealthRecordInput,
  type HealthRecordDto,
  type HealthRecordKind,
  KIND_VALUES,
  kindLabelKey,
  toIsoDate,
} from "./dto";

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

type LocalErr = "titleRequired" | "dateRequired" | null;

/**
 * 人工录入弹窗岛（写）：触发按钮 + 模态表单 → POST /api/health/reports。
 * - 字段：kind(4 选一) / title(必填) / source(可选) / recordedAt(date → ISO)
 * - 前端校验 title/date；后端 400 或网络失败 → 受信文案（不泄漏后端 message）
 * - 成功（201）→ onCreated()（父 refetch）+ 关闭复位
 * - 取消 / Esc / 点遮罩关闭并复位
 */
export function AddReportDialog({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("portal.reports");
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<HealthRecordKind>("lab");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [localErr, setLocalErr] = useState<LocalErr>(null);

  const create = useMutation<CreateHealthRecordInput, HealthRecordDto>(
    (input) => apiClient.post<HealthRecordDto>("/api/health/reports", input),
    {
      onSuccess: () => {
        onCreated();
        close();
      },
    },
  );

  function close() {
    setOpen(false);
    setKind("lab");
    setTitle("");
    setSource("");
    setRecordedAt("");
    setLocalErr(null);
    create.reset();
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalErr("titleRequired");
      return;
    }
    const iso = toIsoDate(recordedAt);
    if (!iso) {
      setLocalErr("dateRequired");
      return;
    }
    if (create.loading) return;
    setLocalErr(null);
    create.mutate({
      kind,
      title: trimmed,
      source: source.trim() || undefined,
      recordedAt: iso,
    });
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white bg-dr-red px-4 py-2.5 cursor-pointer hover:opacity-90 transition-opacity border-none"
      >
        {t("addCta")}
      </button>

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
                marginBottom: 16,
                fontFamily: "var(--p-serif)",
                fontSize: 20,
                fontWeight: 400,
              }}
            >
              {t("form.title")}
            </h3>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-[11px] text-dr-mid">
                {t("form.kind")}
                <select
                  aria-label={t("form.kind")}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as HealthRecordKind)}
                  disabled={create.loading}
                  className="border border-dr-border px-3 py-2 text-[13px] text-dr-ink bg-white"
                >
                  {KIND_VALUES.map((k) => (
                    <option key={k} value={k}>
                      {t(kindLabelKey(k))}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] text-dr-mid">
                {t("form.titleField")}
                <input
                  type="text"
                  aria-label={t("form.titleField")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={create.loading}
                  className="border border-dr-border px-3 py-2 text-[13px] text-dr-ink"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] text-dr-mid">
                {t("form.source")}
                <input
                  type="text"
                  aria-label={t("form.source")}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={create.loading}
                  className="border border-dr-border px-3 py-2 text-[13px] text-dr-ink"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] text-dr-mid">
                {t("form.recordedAt")}
                <input
                  type="date"
                  aria-label={t("form.recordedAt")}
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  disabled={create.loading}
                  className="border border-dr-border px-3 py-2 text-[13px] text-dr-ink"
                />
              </label>
            </div>

            {localErr && (
              <p
                className="text-dr-red"
                style={{ fontSize: 12, lineHeight: 1.6, marginTop: 12 }}
              >
                {t(`form.${localErr}`)}
              </p>
            )}

            {create.error && (
              <div style={{ marginTop: 12 }}>
                <ErrorState message={toErrorMessage(create.error)} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={close}
                disabled={create.loading}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-dr-mid border border-dr-border px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                {t("form.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={create.loading}
                className="text-[12px] font-bold tracking-[0.16em] uppercase text-white bg-dr-red border-none px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                {create.loading ? t("form.submitting") : t("form.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
