import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  PENDING_REPORTS,
  REPORT_REVIEW,
  SCORE_TONE_STYLE,
  toneForScore,
} from "@/config/clinic-portal-mock";

const FINDING_STYLE: Record<
  string,
  { tagClass: string; borderClass: string; labelKey: string }
> = {
  good: {
    tagClass: "text-dr-success bg-[rgba(31,158,90,0.1)]",
    borderClass: "border-l-dr-success",
    labelKey: "reports.findingPositive",
  },
  warn: {
    tagClass: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
    borderClass: "border-l-dr-warn",
    labelKey: "reports.findingMonitor",
  },
  alert: {
    tagClass: "text-dr-red bg-[rgba(200,16,46,0.08)]",
    borderClass: "border-l-dr-red",
    labelKey: "reports.findingAction",
  },
};

export function generateStaticParams() {
  return PENDING_REPORTS.map((r) => ({ id: r.id }));
}

// AI Report review page (spec §3.3): patient info + 3 Brenner Indices +
// AI draft (Good/Monitor/Action) + doctor edit area + authorized-data scope
// + Send / Save Draft / Reject actions. Reports stay on DrRuby platform.
export default async function ReportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = REPORT_REVIEW[id];
  if (!report) notFound();

  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("reports.reviewPageTitle")}
      pageSub={t("reports.reviewPageSub")}
      primaryAction={{ label: t("common.send"), href: "#" }}
    >
      <div className="max-w-[900px]">
        <Link
          href="/clinic/reports/queue"
          className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-mid no-underline hover:text-dr-ink transition-colors inline-block mb-4"
        >
          {t("common.backToQueue")}
        </Link>

        {/* Patient header */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("reports.patientHeading")}
          </div>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="font-serif text-[26px] font-light text-dr-ink leading-tight">
                {report.patientName}
              </div>
              <div className="text-[11px] text-dr-mid mt-1">
                {t("reports.authStatus")}
              </div>
            </div>
            <div className="text-[11px] text-dr-mid">
              {report.scanDate}
            </div>
          </div>
        </div>

        {/* Three Brenner Indices */}
        <div className="mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("reports.indicesHeading")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <IndexCard
              label={t("workbench.colInflammation")}
              value={report.indices.inflammation.value}
              trend={report.indices.inflammation.trend}
            />
            <IndexCard
              label={t("workbench.colPigment")}
              value={report.indices.pigment.value}
              trend={report.indices.pigment.trend}
            />
            <IndexCard
              label={t("workbench.colCollagen")}
              value={report.indices.collagen.value}
              trend={report.indices.collagen.trend}
            />
          </div>
        </div>

        {/* AI Draft */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("reports.aiDraftHeading")}
          </div>
          <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1.5">
            {t("reports.aiDraftSummaryLabel")}
          </div>
          <p className="text-[12px] text-dr-ink leading-[1.7] mb-4">
            {report.aiDraft.summary}
          </p>
          <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-2">
            {t("reports.findingsLabel")}
          </div>
          <div className="flex flex-col gap-2.5">
            {report.aiDraft.findings.map((f, i) => {
              const style = FINDING_STYLE[f.level];
              return (
                <div
                  key={`${f.title}-${i}`}
                  className={`bg-dr-off border border-dr-border border-l-2 ${style.borderClass} p-3.5`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                    <div className="font-serif text-[17px] font-light text-dr-ink leading-tight flex-1 min-w-[180px]">
                      {f.title}
                    </div>
                    <span
                      className={`text-[7px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 ${style.tagClass}`}
                    >
                      {t(style.labelKey as never)}
                    </span>
                  </div>
                  <p className="text-[11px] text-dr-ink leading-[1.6]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Authorized data scope */}
        <div className="bg-[rgba(31,158,90,0.04)] border border-[rgba(31,158,90,0.15)] p-4 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-success mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-success" />
            {t("reports.authorizedDataHeading")}
          </div>
          <ul className="text-[11px] text-dr-ink leading-[1.8] list-none">
            {report.authorizedData.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <span className="text-dr-success flex-shrink-0">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Doctor edit area */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("reports.editHeading")}
          </div>
          <textarea
            className="w-full min-h-[120px] text-[11px] text-dr-ink border border-dr-border bg-dr-off p-3 resize-y focus:outline-none focus:border-dr-mid"
            placeholder={t("reports.editPlaceholder")}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="bg-dr-red text-white px-5 py-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {t("common.send")}
          </button>
          <button
            type="button"
            className="text-dr-ink bg-dr-white border border-dr-border px-5 py-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase cursor-pointer hover:border-dr-mid transition-colors"
          >
            {t("common.saveDraft")}
          </button>
          <button
            type="button"
            className="text-dr-mid px-5 py-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase cursor-pointer hover:text-dr-red transition-colors"
          >
            {t("common.reject")}
          </button>
        </div>
      </div>
    </ClinicShell>
  );
}

function IndexCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: string;
}) {
  const tone = toneForScore(value);
  const barWidth = `${value}%`;
  const barColor =
    tone === "good"
      ? "bg-dr-success"
      : tone === "warn"
        ? "bg-dr-warn"
        : "bg-dr-red";
  return (
    <div className="bg-dr-white border border-dr-border p-5">
      <div className="text-[8px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span
          className={`font-serif text-[36px] font-light leading-none ${SCORE_TONE_STYLE[tone]}`}
        >
          {value}
        </span>
        <span className="text-[10px] text-dr-mid">/100</span>
      </div>
      <div className="h-1 bg-dr-grey mb-2">
        <div
          className={`h-full ${barColor}`}
          style={{ width: barWidth }}
        />
      </div>
      <div className="text-[9px] text-dr-mid">{trend}</div>
    </div>
  );
}
