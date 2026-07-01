import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  PATIENTS,
  PATIENT_STATUS_STYLE,
  SCORE_TONE_STYLE,
  toneForScore,
  type PatientStatus,
} from "@/config/clinic-portal-mock";

// Patients list (spec §5.1): clinic sees only its own patients (data
// isolation red line, §0.2). Filters by status / scan date / index range.
export default async function ClinicPatientsPage() {
  const t = await getTranslations("clinic");

  const statusLabelKey: Record<PatientStatus, string> = {
    active: "patients.filterActive",
    pending: "patients.filterPending",
    new: "patients.filterNew",
  };

  return (
    <ClinicShell
      pageTitle={t("patients.pageTitle")}
      pageSub={t("patients.pageSub")}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("patients.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("patients.sub")}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-dr-white border border-dr-border p-3 mb-4 flex items-center gap-2 flex-wrap">
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mr-1">
            {t("patients.filterAll")}:
          </div>
          <FilterChip label={t("patients.filterAll")} active />
          {(["active", "pending", "new"] as PatientStatus[]).map((s) => (
            <FilterChip key={s} label={t(statusLabelKey[s] as never)} />
          ))}
          <span className="ml-auto text-[9px] text-dr-mid">
            {PATIENTS.length} patients
          </span>
        </div>

        {/* Patient table */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("patients.colPatient")}</Th>
                  <Th>{t("patients.colAgeRange")}</Th>
                  <Th>{t("patients.colLastScan")}</Th>
                  <Th>{t("patients.colIndices")}</Th>
                  <Th>{t("patients.colAuth")}</Th>
                  <Th>{t("patients.colStatus")}</Th>
                  <Th>{t("patients.colNextAppt")}</Th>
                </tr>
              </thead>
              <tbody>
                {PATIENTS.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link
                        href={`/clinic/patients/${p.id}`}
                        className="font-medium text-dr-ink no-underline hover:text-dr-red transition-colors"
                      >
                        {p.name}
                      </Link>
                      <div className="text-[9px] text-dr-mid mt-0.5">{p.concern}</div>
                    </Td>
                    <Td>{p.ageRange}</Td>
                    <Td>{p.lastScan}</Td>
                    <Td>
                      <div className="flex gap-1.5 flex-wrap">
                        <ScorePill value={p.indices.inflammation} label="I" />
                        <ScorePill value={p.indices.pigment} label="P" />
                        <ScorePill value={p.indices.collagen} label="C" />
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[8px] text-dr-success">
                        {t("common.authorized")}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={`text-[8px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 ${PATIENT_STATUS_STYLE[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[10px] text-dr-ink">
                        {p.nextAppointment ?? "—"}
                      </span>
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

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`text-[9px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 cursor-pointer ${
        active
          ? "bg-dr-ink text-white"
          : "bg-dr-off text-dr-mid border border-dr-border hover:text-dr-ink"
      }`}
    >
      {label}
    </span>
  );
}

function ScorePill({ value, label }: { value: number; label: string }) {
  const tone = toneForScore(value);
  return (
    <span
      className={`text-[9px] font-medium px-1.5 py-0.5 ${SCORE_TONE_STYLE[tone]}`}
      title={label}
    >
      {label} {value}
    </span>
  );
}
