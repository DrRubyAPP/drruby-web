import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { AI_REPORTS } from "@/config/user-portal-mock";

const FINDING_TAG_STYLE: Record<string, string> = {
  good: "text-dr-success bg-[rgba(31,158,90,0.1)]",
  warn: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
  alert: "text-dr-red bg-[rgba(200,16,46,0.08)]",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-dr-red text-white",
  viewed: "bg-dr-off text-dr-mid border border-dr-border",
};

export default async function ReportsPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("reports.listPageTitle")}
      pageSub={t("reports.listPageSub")}
    >
      <div className="max-w-[820px]">
        <div className="mb-4">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("reports.listTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("reports.listSub")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {AI_REPORTS.map((rpt) => {
            const counts = rpt.findings.reduce(
              (acc, f) => {
                acc[f.level] += 1;
                return acc;
              },
              { good: 0, warn: 0, alert: 0 } as Record<string, number>,
            );
            return (
              <Link
                key={rpt.id}
                href={`/portal/reports/${rpt.id}`}
                className="bg-dr-white border border-dr-border p-5 no-underline text-dr-ink hover:border-dr-mid transition-colors block"
              >
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1">
                      {rpt.date}
                    </div>
                    <div className="font-serif text-[20px] font-light text-dr-ink leading-tight">
                      {rpt.title}
                    </div>
                    <div className="text-[11px] text-dr-mid mt-1">{rpt.summary}</div>
                  </div>
                  <span
                    className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${STATUS_STYLE[rpt.status]}`}
                  >
                    {rpt.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {counts.good > 0 && (
                    <span className={`text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${FINDING_TAG_STYLE.good}`}>
                      · {counts.good} Positive
                    </span>
                  )}
                  {counts.warn > 0 && (
                    <span className={`text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${FINDING_TAG_STYLE.warn}`}>
                      · {counts.warn} Monitor
                    </span>
                  )}
                  {counts.alert > 0 && (
                    <span className={`text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${FINDING_TAG_STYLE.alert}`}>
                      · {counts.alert} Action
                    </span>
                  )}
                  <span className="ml-auto text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red">
                    Open →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}
