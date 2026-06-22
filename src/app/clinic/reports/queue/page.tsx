import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  PENDING_REPORTS,
  SCORE_TONE_STYLE,
  toneForScore,
} from "@/config/clinic-portal-mock";

// AI Reports queue (spec §3.2): priority banner + patient table + filters
// + batch operations. The same patient table from the Workbench appears
// here with extra filter controls.
export default async function ReportsQueuePage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("reports.queuePageTitle")}
      pageSub={t("reports.queuePageSub")}
      primaryAction={{ label: t("topbar.generateReport"), href: "/clinic/skin-archive/upload" }}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("reports.queueTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("reports.queueSub")}
          </p>
        </div>

        {/* Priority banner */}
        <div className="bg-dr-ink p-5 flex items-center justify-between gap-5 flex-wrap mb-4">
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
          <div className="flex gap-2 items-center flex-shrink-0">
            <button
              type="button"
              className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-ink bg-dr-white border border-dr-border px-3 py-1.5 cursor-pointer hover:border-dr-mid transition-colors"
            >
              Batch Review
            </button>
            <button
              type="button"
              className="text-[9px] font-semibold tracking-[0.14em] uppercase bg-dr-red text-white px-3 py-1.5 cursor-pointer border-none hover:opacity-90 transition-opacity"
            >
              Batch Send
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-dr-white border border-dr-border p-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid">
            Filters
          </div>
          <select className="text-[10px] text-dr-ink border border-dr-border bg-dr-white px-2.5 py-1.5 cursor-pointer">
            <option>All dates</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <select className="text-[10px] text-dr-ink border border-dr-border bg-dr-white px-2.5 py-1.5 cursor-pointer">
            <option>All patients</option>
            {PENDING_REPORTS.map((r) => (
              <option key={r.id}>{r.patientName}</option>
            ))}
          </select>
          <select className="text-[10px] text-dr-ink border border-dr-border bg-dr-white px-2.5 py-1.5 cursor-pointer">
            <option>All urgency</option>
            <option>Urgent first</option>
            <option>By scan date</option>
          </select>
        </div>

        {/* Patient queue table */}
        <div className="bg-dr-white border border-dr-border p-5">
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
                  <Th>{t("workbench.colAction")}</Th>
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
                      <span className="text-[8px] text-dr-success">
                        {t("common.authorized")}
                      </span>
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
          <div className="mt-3 p-3 bg-[rgba(31,158,90,0.04)] border border-[rgba(31,158,90,0.1)] text-[9px] text-dr-mid leading-[1.6]">
            <span>🔒 </span>
            <strong className="text-dr-ink">Data Privacy:</strong>{" "}
            {t("dataPrivacy.tableFootnote")}
          </div>
        </div>
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
