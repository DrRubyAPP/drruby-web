import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  APPOINTMENTS_TODAY_META,
  FINANCE_KPIS,
  NEW_REFERRALS,
  PENDING_REPORTS,
  TODAY_APPOINTMENTS,
  SCORE_TONE_STYLE,
  toneForScore,
} from "@/config/clinic-portal-mock";

// Clinic Portal Workbench — first screen after a doctor logs in.
// Spec §2: three things that matter today (AI Reports queue, Today's
// Appointments, New DrRuby Referrals), then a Finance summary strip.
export default async function ClinicWorkbenchPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("workbench.pageTitle")}
      pageSub={t("workbench.pageSub")}
      primaryAction={{ label: t("topbar.generateReport"), href: "/clinic/skin-archive/upload" }}
    >
      {/* ① Priority banner — AI Reports awaiting review (dark) */}
      <div className="bg-dr-ink p-5 flex items-center justify-between gap-5 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[260px]">
          <div className="w-10 h-10 bg-dr-red flex items-center justify-center font-serif text-[22px] font-light text-white flex-shrink-0">
            {PENDING_REPORTS.length}
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white mb-0.5">
              {t("workbench.priorityBannerEyebrow")}
            </div>
            <div className="text-[9px] text-white/35">
              {t("workbench.priorityBannerSub")}
            </div>
          </div>
        </div>
        <Link
          href="/clinic/reports/queue"
          className="text-[9px] font-semibold tracking-[0.14em] uppercase bg-dr-red text-white px-3 py-1.5 no-underline hover:opacity-90 transition-opacity flex-shrink-0"
        >
          {t("workbench.reviewReportsCta")}
        </Link>
      </div>

      {/* ② Pending AI Reports table */}
      <div className="bg-dr-white border border-dr-border p-5 border-t-0">
        <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("workbench.pendingReportsTitle")}
          </div>
          <span className="text-[9px] text-dr-mid">
            {t("workbench.pendingReportsMeta")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>{t("workbench.colPatient")}</Th>
                <Th>{t("workbench.colScanDate")}</Th>
                <Th>{t("workbench.colInflammation")}</Th>
                <Th>{t("workbench.colPigment")}</Th>
                <Th>{t("workbench.colCollagen")}</Th>
                <Th>{t("workbench.colDataAuth")}</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {PENDING_REPORTS.map((r) => (
                <tr
                  key={r.id}
                  className={r.urgent ? "bg-[rgba(200,16,46,0.02)]" : undefined}
                >
                  <Td>
                    <span className="font-medium text-dr-ink">{r.patientName}</span>
                  </Td>
                  <Td>{r.scanDate}</Td>
                  <Td>
                    <ScoreCell value={r.indices.inflammation} />
                  </Td>
                  <Td>
                    <ScoreCell value={r.indices.pigment} />
                  </Td>
                  <Td>
                    <ScoreCell value={r.indices.collagen} />
                  </Td>
                  <Td>
                    <span className="text-[8px] text-dr-success">{t("common.authorized")}</span>
                  </Td>
                  <Td>
                    <Link
                      href={`/clinic/reports/${r.id}/review`}
                      className="bg-dr-red text-white text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 no-underline hover:opacity-90 transition-opacity inline-block"
                    >
                      {t("common.review")}
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Data privacy footnote (spec §0.3) */}
        <div className="mt-3 p-3 bg-[rgba(31,158,90,0.04)] border border-[rgba(31,158,90,0.1)] text-[9px] text-dr-mid leading-[1.6]">
          <span>🔒 </span>
          <strong className="text-dr-ink">Data Privacy:</strong>{" "}
          {t("dataPrivacy.tableFootnote")}
        </div>
      </div>

      {/* ③ Today's Appointments + New DrRuby Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Appointments */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-red" />
              {t("workbench.todaysAppointmentsTitle")}
            </div>
            <span className="text-[9px] text-dr-mid">
              {t("workbench.todaysAppointmentsMeta", {
                total: APPOINTMENTS_TODAY_META.total,
                remaining: APPOINTMENTS_TODAY_META.remaining,
              })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {TODAY_APPOINTMENTS.map((a) => {
              const isDone = a.state === "done";
              const isNow = a.state === "now";
              return (
                <div
                  key={a.id}
                  className={`flex gap-3 items-center p-3 ${
                    isDone
                      ? "bg-dr-off opacity-40"
                      : isNow
                        ? "bg-[rgba(200,16,46,0.04)] border-l-2 border-l-dr-red"
                        : "bg-dr-off"
                  }`}
                >
                  <div className="font-serif text-[16px] text-dr-ink font-light min-w-[44px] text-center border-r border-dr-border pr-3">
                    {a.time}
                    <small className="block text-[8px] text-dr-mid font-sans tracking-[0.1em]">
                      {a.meridiem}
                    </small>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-dr-ink">
                      {a.patientName}
                    </div>
                    <div className="text-[9px] text-dr-mid">
                      {a.type.includes("Now") ? (
                        <>
                          {a.type.split(" · ")[0]} ·{" "}
                          <span className="text-dr-red font-semibold">
                            {t("appointments.now")}
                          </span>
                        </>
                      ) : a.isDrRubyReferral ? (
                        <>
                          {a.type.split(" · ")[0]} ·{" "}
                          <span className="text-dr-success font-medium">
                            {t("appointments.drRubyReferral")}
                          </span>
                        </>
                      ) : (
                        a.type
                      )}
                    </div>
                  </div>
                  {!isDone && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      {isNow ? (
                        <Link
                          href={`/clinic/reports/queue`}
                          className="bg-dr-red text-white text-[8px] font-semibold tracking-[0.1em] uppercase px-2 py-1 no-underline hover:opacity-90 transition-opacity"
                        >
                          {t("common.start")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="bg-dr-off text-dr-mid border border-dr-border text-[8px] font-semibold tracking-[0.1em] uppercase px-2 py-1 cursor-pointer hover:text-dr-ink transition-colors"
                        >
                          {t("common.view")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* New DrRuby Referrals — green-bordered card */}
        <div className="bg-dr-white border border-dr-border border-t-[3px] border-t-dr-success p-5">
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-success flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-success" />
              {t("workbench.newReferralsTitle")}
            </div>
            <span className="text-[8px] font-bold bg-dr-success text-white px-2 py-0.5 rounded-[2px]">
              {t("workbench.newReferralsBadge", { count: NEW_REFERRALS.length })}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {NEW_REFERRALS.map((r) => (
              <div
                key={r.id}
                className="border border-[rgba(31,158,90,0.15)] bg-[rgba(31,158,90,0.02)] p-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                  <div>
                    <div className="text-[11px] font-medium text-dr-ink">
                      {r.patientName}
                    </div>
                    <div className="text-[9px] text-dr-mid mt-px">
                      Referred via DrRuby · {r.referredAt}
                    </div>
                  </div>
                  <span className="text-[8px] font-semibold text-dr-success border border-[rgba(31,158,90,0.3)] px-2 py-0.5">
                    {t("common.new")}
                  </span>
                </div>
                <div className="flex gap-2 mb-2.5 flex-wrap">
                  {r.indices.map((idx) => {
                    const tone = toneForScore(idx.value);
                    return (
                      <div
                        key={idx.label}
                        className={`text-[9px] font-semibold px-2 py-0.5 ${
                          tone === "alert"
                            ? "bg-[rgba(200,16,46,0.07)] text-dr-red"
                            : "bg-[rgba(184,106,0,0.07)] text-dr-warn"
                        }`}
                      >
                        {idx.label} {idx.value}
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-dr-mid leading-[1.6] mb-2.5">
                  Patient notes: {r.patientNotes}
                </div>
                <div className="text-[8px] text-[rgba(0,0,0,0.55)] mb-2">
                  ⚠ {t("dataPrivacy.referralFootnote")}
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/clinic/referrals"
                    className="bg-dr-red text-white text-[8px] font-semibold tracking-[0.1em] uppercase px-3 py-1 no-underline hover:opacity-90 transition-opacity"
                  >
                    {t("common.accept")}
                  </Link>
                  <Link
                    href="/clinic/patients"
                    className="bg-dr-off text-dr-mid border border-dr-border text-[8px] font-semibold tracking-[0.1em] uppercase px-3 py-1 no-underline hover:text-dr-ink transition-colors"
                  >
                    {t("common.viewProfile")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Finance summary strip (4 KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-dr-border">
        <KpiCell
          label={t("workbench.financeKpiRevenue")}
          value={FINANCE_KPIS.thisMonthRevenue.value}
          trend={
            <span>
              <span className="text-dr-success">
                {FINANCE_KPIS.thisMonthRevenue.trend.split(" ")[0]}{" "}
                {FINANCE_KPIS.thisMonthRevenue.trend.split(" ")[1]}
              </span>{" "}
              {FINANCE_KPIS.thisMonthRevenue.trend.split(" ").slice(2).join(" ")}
            </span>
          }
        />
        <KpiCell
          label={t("workbench.financeKpiReferral")}
          value={FINANCE_KPIS.drRubyReferralIncome.value}
          valueClass="text-dr-success"
          trend={FINANCE_KPIS.drRubyReferralIncome.trend}
        />
        <KpiCell
          label={t("workbench.financeKpiFee")}
          value={FINANCE_KPIS.platformModuleFee.value}
          valueClass="text-dr-mid text-[20px]"
          trend={FINANCE_KPIS.platformModuleFee.trend}
        />
        <KpiCell
          label={t("workbench.financeKpiNet")}
          value={FINANCE_KPIS.netFromDrRuby.value}
          valueClass="text-dr-success"
          trend={t("workbench.financeKpiNetFootnote")}
          bgClass="bg-dr-off border-l-2 border-l-dr-success"
        />
      </div>
    </ClinicShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-[8px] font-semibold tracking-[0.18em] uppercase text-dr-mid p-2.5 text-left border-b border-dr-border">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`text-[10px] text-dr-ink p-2.5 border-b border-dr-border ${className}`}>
      {children}
    </td>
  );
}

function ScoreCell({ value }: { value: number }) {
  const tone = toneForScore(value);
  return (
    <span className={`font-medium ${SCORE_TONE_STYLE[tone]}`}>{value}/100</span>
  );
}

function KpiCell({
  label,
  value,
  trend,
  valueClass = "",
  bgClass = "bg-dr-white",
}: {
  label: string;
  value: string;
  trend: React.ReactNode;
  valueClass?: string;
  bgClass?: string;
}) {
  return (
    <div className={`${bgClass} p-4 md:p-5`}>
      <div className="text-[8px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1">
        {label}
      </div>
      <div className={`font-serif text-[24px] font-light text-dr-ink ${valueClass}`}>
        {value}
      </div>
      <div className="text-[9px] text-dr-mid mt-0.5">{trend}</div>
    </div>
  );
}
