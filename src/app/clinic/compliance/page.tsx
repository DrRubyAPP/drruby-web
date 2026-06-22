import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import { COMPLIANCE_DOCS } from "@/config/clinic-portal-mock";

// Compliance (spec §11): electronic informed consents, audit log, and
// conversion-rate tracking. MVP allows paper fallback; full e-consent
// flow comes post-Phase-2.
const STATUS_STYLE: Record<string, string> = {
  archived: "text-dr-success bg-[rgba(31,158,90,0.1)]",
  pending: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
};

export default async function CompliancePage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("compliance.pageTitle")}
      pageSub={t("compliance.pageSub")}
    >
      <div className="max-w-[820px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("compliance.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("compliance.sub")}
          </p>
        </div>

        {/* Consent documents */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("compliance.docsHeading")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("compliance.colType")}</Th>
                  <Th>{t("compliance.colPatient")}</Th>
                  <Th>{t("compliance.colSigned")}</Th>
                  <Th>{t("compliance.colStatus")}</Th>
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE_DOCS.map((d) => (
                  <tr key={d.id}>
                    <Td>{d.type}</Td>
                    <Td>
                      <span className="font-medium text-dr-ink">{d.patientName}</span>
                    </Td>
                    <Td>{d.signedDate}</Td>
                    <Td>
                      <span
                        className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${STATUS_STYLE[d.status]}`}
                      >
                        {d.status === "archived"
                          ? t("compliance.statusArchived")
                          : t("compliance.statusPending")}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit notice (spec §16) */}
        <div className="bg-dr-ink p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.6)] mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-[rgba(200,16,46,0.6)]" />
            Audit Trail
          </div>
          <p className="text-[11px] text-white/70 leading-[1.7]">
            {t("compliance.auditNotice")}
          </p>
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
