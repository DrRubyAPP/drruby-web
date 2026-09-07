"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";
import type { HealthRecordDto, SignalDto } from "./dto";
import { LogForm } from "./LogForm";
import { mapHealthRecords, mapSignals } from "./mappers";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { UploadDialog } from "./UploadDialog";

/** My Health（health）视图。
 *  Your data（C1 录入入口：Log / Upload / Photos）+ Your records（真实
 *  /api/health/records，§12 状态机徽标）+ Recent labs（signals API）。
 *
 *  task-42 T7：C1 录入入口 + t()。设备连接（Apple Health / wearable）属 Non-Scope。
 *  task-47：删除全部假数据（Your body right now / Current focus / Meaningful
 *  follow-ups / Browse all 连同外壳整段移除，契约 §25——假数据不留壳），接真实
 *  records 列表；Meaning 层将来由 task-43 用真实数据重建。 */
const DATA_IMPORTS = [
  {
    key: "log",
    labelKey: "intake.log.label",
    subKey: "intake.log.sub",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 3h14M7 3v18l5-4 5 4V3" />
      </svg>
    ),
  },
  {
    key: "upload",
    labelKey: "intake.upload.label",
    subKey: "intake.upload.sub",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
      </svg>
    ),
  },
  {
    key: "photos",
    labelKey: "intake.photos.label",
    subKey: "intake.photos.sub",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="M21 17l-5-5-7 7" />
      </svg>
    ),
  },
] as const;

export function HealthView() {
  const t = useTranslations("myHealth");
  const tr = useTranslations("records");
  const router = useRouter();
  const signals = useApi<SignalDto[]>("/api/signals");
  const records = useApi<HealthRecordDto[]>("/api/health/records");

  // C1 录入入口弹层状态
  const [logOpen, setLogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const signalRows = mapSignals(signals.data ?? []);
  const recordRows = mapHealthRecords(records.data ?? []);

  return (
    <>
      <h1>{t("title")}</h1>
      <div className="lede">{t("lede")}</div>

      {/* ===== Your data（C1 录入入口：Log / Upload / Photos）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.yourData")}</div>
        <div className="data-grid">
          {DATA_IMPORTS.map((d) => (
            <button
              key={d.key}
              type="button"
              className="data-btn"
              onClick={() => {
                if (d.key === "log") setLogOpen(true);
                else if (d.key === "photos") setPhotoOpen(true);
                else setUploadOpen(true);
              }}
            >
              <span className="data-ic">{d.icon}</span>
              <b>{t(d.labelKey)}</b>
              <span>{t(d.subKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Your records（真实 /api/health/records，§12 状态机徽标）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.records")}</div>
        {records.loading ? (
          <Skeleton lines={3} />
        ) : records.error ? (
          <ErrorState
            message={records.error.message}
            onRetry={records.refetch}
          />
        ) : recordRows.length === 0 ? (
          <EmptyState
            title={t("recordsEmptyTitle")}
            hint={t("recordsEmptyHint")}
          />
        ) : (
          <div className="card">
            {recordRows.map((r) => (
              <Link
                key={r.id}
                href={`/portal/health/review/${r.id}`}
                className="rec-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f0ece9",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5 }}>
                    {r.title}
                  </span>
                  <span style={{ fontSize: 12, color: "#a89a95" }}>
                    {t(`kindLabel.${r.kind}`)}
                    {r.source?.fileName ? ` · ${r.source.fileName}` : ""}
                  </span>
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: "#7c746f",
                  }}
                >
                  {tr(r.statusKey)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== Recent labs（signals API）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.recentLabs")}</div>
        {signals.loading ? (
          <Skeleton lines={3} />
        ) : signals.error ? (
          <ErrorState
            message={signals.error.message}
            onRetry={signals.refetch}
          />
        ) : signalRows.length === 0 ? (
          <EmptyState
            title={t("signalsEmptyTitle")}
            hint={t("signalsEmptyHint")}
          />
        ) : (
          <div className="card">
            {signalRows.map((s) => (
              <div className="lab-row" key={s.id}>
                <div className="lab-name">{s.label}</div>
                <div className="lab-val">{s.display}</div>
                <span className="conf pos">{s.confidence}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ===== C1 录入弹层（手动录入 + 上传）===== */}
      <LogForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={() => {
          records.refetch();
          signals.refetch();
        }}
      />
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(recordId) =>
          router.push(`/portal/health/review/${recordId}`)
        }
      />
      <PhotoUploadDialog
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onUploaded={(recordId) =>
          router.push(`/portal/health/review/${recordId}`)
        }
      />
    </>
  );
}
