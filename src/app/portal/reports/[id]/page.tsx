import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import MedicalDisclaimer from "@/components/common/MedicalDisclaimer";
import { AI_REPORTS } from "@/config/user-portal-mock";

const FINDING_STYLE: Record<string, { tagClass: string; borderClass: string; label: string }> = {
  good: {
    tagClass: "text-dr-success bg-[rgba(31,158,90,0.1)]",
    borderClass: "border-l-dr-success",
    label: "Positive",
  },
  warn: {
    tagClass: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
    borderClass: "border-l-dr-warn",
    label: "Monitor",
  },
  alert: {
    tagClass: "text-dr-red bg-[rgba(200,16,46,0.08)]",
    borderClass: "border-l-dr-red",
    label: "Action",
  },
};

export function generateStaticParams() {
  return AI_REPORTS.map((r) => ({ id: r.id }));
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = AI_REPORTS.find((r) => r.id === id);
  if (!report) notFound();

  const t = await getTranslations("portal");

  return (
    <PortalShell
      pageTitle={report.title}
      pageSub={t("reports.detailPageSub", { date: report.date })}
      primaryAction={{ label: t("common.download"), href: "#" }}
    >
      <div className="max-w-[760px]">
        <Link
          href="/portal/reports"
          className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-mid no-underline hover:text-dr-ink transition-colors inline-block mb-4"
        >
          {t("reports.backToList")}
        </Link>

        <div className="mb-5">
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1">
            {report.date} · {report.summary}
          </div>
          <h1 className="font-serif text-[32px] md:text-[40px] font-light text-dr-ink leading-[1.15]">
            {report.title}
          </h1>
        </div>

        {/* Findings grouped by level */}
        <div className="flex flex-col gap-3 mb-5">
          {report.findings.map((f, i) => {
            const style = FINDING_STYLE[f.level];
            return (
              <div
                key={`${f.title}-${i}`}
                className={`bg-dr-white border border-dr-border border-l-2 ${style.borderClass} p-4`}
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="font-serif text-[18px] font-light text-dr-ink leading-tight flex-1 min-w-[200px]">
                    {f.title}
                  </div>
                  <span
                    className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${style.tagClass}`}
                  >
                    {f.tag}
                  </span>
                </div>
                <p className="text-[12px] text-dr-ink leading-[1.7]">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Doctor-shareable summary */}
        <div className="bg-dr-ink p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.6)] mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-[rgba(200,16,46,0.6)]" />
            {t("reports.summaryHeading")}
          </div>
          <p className="text-[12px] text-white/80 leading-[1.7] mb-3">
            {t("reports.summaryDesc")}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="bg-dr-red text-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] uppercase border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              {t("common.download")}
            </button>
            <Link
              href="/portal/clinic"
              className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/70 no-underline border border-white/15 px-4 py-2 hover:text-white hover:border-white/30 transition-colors"
            >
              {t("reports.shareCta")}
            </Link>
          </div>
        </div>

        <MedicalDisclaimer />
      </div>
    </PortalShell>
  );
}
