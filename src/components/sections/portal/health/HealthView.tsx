"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/i18n/navigation";
import type { SignalDto } from "./dto";
import { LogForm } from "./LogForm";
import { mapSignals } from "./mappers";
import { UploadDialog } from "./UploadDialog";

/** My Health（health）视图：对齐设计稿 v-health 结构。
 *  静态区块（Your data / Your body right now / Current focus / Meaningful
 *  follow-ups / Browse all）照设计稿渲染；Recent labs（signals）、Cycle &
 *  hormones、Skin observations 接真实 API。
 *
 *  task-42 T7：C1 录入入口（Log / Upload / Photos）+ t()。
 *  设备连接（Apple Health / wearable）属 Non-Scope，已剔除。
 *  Current focus / Meaningful follow-ups 等区块属 Meaning 层（task-43），保留原状。 */
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

const BODY_NOW = [
  {
    h: "1 meaningful change",
    p: "Your average bedtime moved about 46 minutes later over the past 10 days.",
    next: "View why this matters →",
    src: "based on Apple Watch sleep data",
    conf: "obs",
    confLabel: "Observed",
  },
  {
    h: "2 stable indicators",
    p: "Your resting heart rate and activity frequency have stayed steady.",
    next: "View details →",
    src: "based on Apple Watch data",
    conf: "obs",
    confLabel: "Stable",
  },
  {
    h: "4 items need more context",
    p: "Your recent LDL result can’t yet be compared — there’s no comparable prior panel on file.",
    next: "Add context →",
    src: "based on your June 12 lab upload",
    conf: "no",
    confLabel: "Not enough information",
  },
];

const FOLLOW_UPS = [
  "Add a comparable photo after August 12",
  "Review sleep trend after 14 nights",
  "Note how you feel 4 weeks after starting treatment",
];

const BROWSE_CATEGORIES = [
  "Lab Results",
  "Wearables",
  "Sleep",
  "Movement",
  "Cycle & Hormones",
  "Mood & Energy",
  "Weight",
  "Skin observations",
  "Symptoms",
  "Appointments",
  "Medical reports",
];

export function HealthView() {
  const t = useTranslations("myHealth");
  const router = useRouter();
  const signals = useApi<SignalDto[]>("/api/signals");

  // C1 录入入口弹层状态
  const [logOpen, setLogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const signalRows = mapSignals(signals.data ?? []);

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
              onClick={() =>
                d.key === "log" ? setLogOpen(true) : setUploadOpen(true)
              }
            >
              <span className="data-ic">{d.icon}</span>
              <b>{t(d.labelKey)}</b>
              <span>{t(d.subKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Your body right now（静态 matter 卡，设计稿；Meaning 层 task-43）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.bodyNow")}</div>
        {BODY_NOW.map((c) => (
          <div className="card matter" key={c.h}>
            <h3>{c.h}</h3>
            <p>{c.p}</p>
            <div className="matter-next">{c.next}</div>
            <div className="why">
              <span className="why-src">{c.src}</span>
              <span className={`conf ${c.conf}`}>{c.confLabel}</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: "#a89a95", marginTop: 4 }}>
          Organized by relevance, not by health domain. DrRuby surfaces what
          changed, what&rsquo;s stable, and what it can&rsquo;t yet assess
          &mdash; not a fixed set of trackers to maintain.
        </div>
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
      {/* ===== Current focus（静态，设计稿；Meaning 层 task-43）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.currentFocus")}</div>
        <div className="card">
          <div style={{ fontFamily: "var(--p-serif)", fontSize: 19 }}>
            Strength &amp; muscle health
          </div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            Based on your stated goal. DrRuby prioritizes related information
            when it is available, and only surfaces it when it becomes relevant
            &mdash; nothing is collected unless you connect or add it.
          </div>
        </div>
      </div>

      {/* ===== Meaningful follow-ups（静态，设计稿；Meaning 层 task-43）===== */}
      <div className="sec">
        <div className="sec-h">{t("section.followUps")}</div>
        <div className="card">
          {FOLLOW_UPS.map((f) => (
            <div className="foll" key={f}>
              <span className="dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Browse all（折叠列表，设计稿）===== */}
      <div className="sec">
        <details className="uf-browse">
          <summary>{t("section.browseAll")}</summary>
          <div className="card" style={{ marginTop: 10 }}>
            {BROWSE_CATEGORIES.map((c) => (
              <div className="sub-row" key={c}>
                <span>{c}</span>
                <span className="arr">&rsaquo;</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* ===== C1 录入弹层（手动录入 + 上传）===== */}
      <LogForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={() => signals.refetch()}
      />
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(recordId) =>
          router.push(`/portal/health/review/${recordId}`)
        }
      />
    </>
  );
}
