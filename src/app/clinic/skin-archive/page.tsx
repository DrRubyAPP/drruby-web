import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  SCAN_RECORDS,
  SCORE_TONE_STYLE,
  toneForScore,
} from "@/config/clinic-portal-mock";

// Skin Archive (spec §4): pre/post comparison tool · AI scores auto-attached ·
// patient-authorized data. MVP uses phone/camera upload — no professional
// dermatoscope hardware (Phase 2 per spec §4.2).
export default async function SkinArchivePage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("skinArchive.pageTitle")}
      pageSub={t("skinArchive.pageSub")}
      primaryAction={{ label: t("skinArchive.uploadCta"), href: "/clinic/skin-archive/upload" }}
    >
      <div>
        <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
              {t.rich("skinArchive.title", {
                em: (chunks) => <em className="italic">{chunks}</em>,
              })}
            </h1>
            <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
              {t("skinArchive.sub")}
            </p>
          </div>
          <Link
            href="/clinic/skin-archive/upload"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white bg-dr-red no-underline px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            {t("skinArchive.uploadCta")}
          </Link>
        </div>

        {/* Scan records table */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("skinArchive.colPatient")}</Th>
                  <Th>{t("skinArchive.colDate")}</Th>
                  <Th>{t("skinArchive.colZone")}</Th>
                  <Th>{t("skinArchive.colIndices")}</Th>
                  <Th>{t("skinArchive.colNote")}</Th>
                </tr>
              </thead>
              <tbody>
                {SCAN_RECORDS.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      <Link
                        href={`/clinic/patients/${s.patientId}`}
                        className="font-medium text-dr-ink no-underline hover:text-dr-red transition-colors"
                      >
                        {s.patientName}
                      </Link>
                    </Td>
                    <Td>{s.date}</Td>
                    <Td>{s.bodyZone}</Td>
                    <Td>
                      <div className="flex gap-2 flex-wrap">
                        <ScorePill
                          label={t("workbench.colInflammation")}
                          value={s.indices.inflammation}
                        />
                        <ScorePill
                          label={t("workbench.colPigment")}
                          value={s.indices.pigment}
                        />
                        <ScorePill
                          label={t("workbench.colCollagen")}
                          value={s.indices.collagen}
                        />
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[10px] text-dr-mid">{s.note ?? "—"}</span>
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

function ScorePill({ label, value }: { label: string; value: number }) {
  const tone = toneForScore(value);
  return (
    <span
      className={`text-[9px] font-medium px-1.5 py-0.5 ${
        tone === "good"
          ? "bg-[rgba(31,158,90,0.1)] text-dr-success"
          : tone === "warn"
            ? "bg-[rgba(184,106,0,0.1)] text-dr-warn"
            : "bg-[rgba(200,16,46,0.08)] text-dr-red"
      }`}
      title={label}
    >
      {label[0]} {value}
    </span>
  );
}
