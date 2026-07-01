import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  getPatientById,
  getPatientTimeline,
  PATIENTS,
  SCORE_TONE_STYLE,
  toneForScore,
} from "@/config/clinic-portal-mock";

export function generateStaticParams() {
  return PATIENTS.map((p) => ({ id: p.id }));
}

// Patient detail (spec §5.2): basic info, scan history, AI report history,
// treatment records, appointment history, authorization management.
// Patient profile is never stored locally — every view pulls an authorized
// snapshot from the DrRuby platform (spec §5.2 footnote).
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatientById(id);
  if (!patient) notFound();

  const timeline = getPatientTimeline(id);
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("patients.detailPageTitle")}
      pageSub={t("patients.detailPageSub")}
      primaryAction={{ label: t("topbar.generateReport"), href: "/clinic/skin-archive/upload" }}
    >
      <div className="max-w-[900px]">
        <Link
          href="/clinic/patients"
          className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-mid no-underline hover:text-dr-ink transition-colors inline-block mb-4"
        >
          {t("common.backToPatients")}
        </Link>

        {/* Basic info */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("patients.basicInfoHeading")}
          </div>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="font-serif text-[28px] font-light text-dr-ink leading-tight">
                {patient.name}
              </div>
              <div className="text-[11px] text-dr-mid mt-1">
                Age range: {patient.ageRange} · Last scan: {patient.lastScan}
              </div>
              <div className="text-[11px] text-dr-ink mt-1">
                Primary concern: {patient.concern}
              </div>
            </div>
            <span className="text-[8px] font-semibold tracking-[0.1em] uppercase px-2 py-1 bg-[rgba(31,158,90,0.1)] text-dr-success">
              {patient.status}
            </span>
          </div>
        </div>

        {/* Three Brenner Indices snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <IndexCard
            label={t("workbench.colInflammation")}
            value={patient.indices.inflammation}
          />
          <IndexCard
            label={t("workbench.colPigment")}
            value={patient.indices.pigment}
          />
          <IndexCard
            label={t("workbench.colCollagen")}
            value={patient.indices.collagen}
          />
        </div>

        {/* Timeline (combined: scans / reports / treatments / appointments) */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("patients.scanHistoryHeading")}
          </div>
          {timeline.length === 0 ? (
            <div className="text-[11px] text-dr-mid">{t("patients.noTimeline")}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {timeline.map((entry, i) => {
                const tone =
                  entry.type === "scan"
                    ? "text-dr-red"
                    : entry.type === "report"
                      ? "text-dr-warn"
                      : entry.type === "treatment"
                        ? "text-dr-success"
                        : "text-dr-mid";
                return (
                  <div key={`${entry.date}-${i}`} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-16 text-right">
                      <div className="text-[10px] font-semibold text-dr-ink">
                        {entry.date}
                      </div>
                    </div>
                    <div className={`text-[12px] flex-shrink-0 ${tone}`}>●</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-dr-ink font-medium">
                        {entry.label}
                      </div>
                      <div className="text-[10px] text-dr-mid">{entry.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Authorization management (spec §5.2 / §0.3) */}
        <div className="bg-[rgba(31,158,90,0.04)] border border-[rgba(31,158,90,0.15)] p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-success mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-success" />
            {t("patients.authManagementHeading")}
          </div>
          <div className="text-[11px] text-dr-ink mb-2">
            <strong>{t("patients.authCurrentScope")}:</strong> Skin scan history · Three Brenner Indices · Self-reported concerns
          </div>
          <div className="text-[10px] text-dr-mid">
            {t("patients.authRevocable")}
          </div>
        </div>
      </div>
    </ClinicShell>
  );
}

function IndexCard({ label, value }: { label: string; value: number }) {
  const tone = toneForScore(value);
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
      <div className="h-1 bg-dr-grey">
        <div className={`h-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
