import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import { INVOICES, TREATMENT_PACKAGES } from "@/config/clinic-portal-mock";

// Treatments & Billing (spec §7) — MVP simplification: package tracking
// + invoice list. Full CRM follow-up automation moved to /clinic/crm.
const STATUS_STYLE: Record<string, string> = {
  paid: "text-dr-success bg-[rgba(31,158,90,0.1)]",
  pending: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
  overdue: "text-dr-red bg-[rgba(200,16,46,0.08)]",
};

const STATUS_KEY: Record<string, string> = {
  paid: "treatments.statusPaid",
  pending: "treatments.statusPending",
  overdue: "treatments.statusOverdue",
};

export default async function TreatmentsPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("treatments.pageTitle")}
      pageSub={t("treatments.pageSub")}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("treatments.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("treatments.sub")}
          </p>
        </div>

        {/* Active treatment packages */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("treatments.packagesHeading")}
          </div>
          <div className="flex flex-col gap-2.5">
            {TREATMENT_PACKAGES.map((p) => {
              const remaining = p.totalSessions - p.usedSessions;
              const pct = (p.usedSessions / p.totalSessions) * 100;
              return (
                <div key={p.id} className="border border-dr-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-[11px] font-medium text-dr-ink">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-dr-mid mt-0.5">
                        {p.patientName} · {p.validPeriod} valid
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-[18px] font-light text-dr-ink">
                        {p.price}
                      </div>
                      <div className="text-[9px] text-dr-mid">
                        {p.usedSessions}/{p.totalSessions} used
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-dr-grey">
                      <div
                        className="h-full bg-dr-red"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-dr-mid">
                      {remaining} remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("treatments.invoicesHeading")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("treatments.colDate")}</Th>
                  <Th>{t("treatments.colPatient")}</Th>
                  <Th>{t("treatments.colItem")}</Th>
                  <Th>{t("treatments.colAmount")}</Th>
                  <Th>{t("treatments.colStatus")}</Th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv) => (
                  <tr key={inv.id}>
                    <Td>{inv.date}</Td>
                    <Td>
                      <span className="font-medium text-dr-ink">{inv.patientName}</span>
                      {inv.hasReferralFee && (
                        <div className="text-[8px] text-dr-success mt-0.5">
                          {t("treatments.referralFee")}
                        </div>
                      )}
                    </Td>
                    <Td>{inv.item}</Td>
                    <Td>
                      <span className="font-serif text-[14px] font-light text-dr-ink">
                        {inv.amount}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${STATUS_STYLE[inv.status]}`}
                      >
                        {t(STATUS_KEY[inv.status] as never)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
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
