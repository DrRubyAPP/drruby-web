import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import { FINANCE_REPORT } from "@/config/clinic-portal-mock";

// Finance & Fees (spec §10): monthly revenue, DrRuby referral income, and
// platform module fees side by side, plus a DrRuby conversion funnel
// (referrals → confirmed → visited → completed → repurchase).
export default async function FinancePage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("finance.pageTitle")}
      pageSub={t("finance.pageSub")}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("finance.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("finance.sub")}
          </p>
        </div>

        {/* Monthly breakdown */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("finance.monthlyHeading")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("finance.colMonth")}</Th>
                  <Th>{t("finance.colRevenue")}</Th>
                  <Th>{t("finance.colReferral")}</Th>
                  <Th>{t("finance.colFee")}</Th>
                </tr>
              </thead>
              <tbody>
                {FINANCE_REPORT.monthly.map((m) => (
                  <tr key={m.month}>
                    <Td>{m.month}</Td>
                    <Td>
                      <span className="font-serif text-[14px] font-light text-dr-ink">
                        {m.revenue}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-serif text-[14px] font-light text-dr-success">
                        {m.referralIncome}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-dr-mid">{m.fee}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("finance.funnelHeading")}
          </div>
          <div className="flex flex-col gap-2.5">
            {FINANCE_REPORT.conversionFunnel.map((s, i) => {
              const prev = i === 0 ? 100 : FINANCE_REPORT.conversionFunnel[i - 1].value;
              const dropoff = i === 0 ? null : Math.round(((prev - s.value) / prev) * 100);
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-44 text-[10px] text-dr-ink flex-shrink-0">
                    {s.stage}
                  </div>
                  <div className="flex-1 h-6 bg-dr-off relative">
                    <div
                      className="h-full bg-dr-red flex items-center justify-end px-2"
                      style={{ width: `${s.value}%` }}
                    >
                      <span className="text-[9px] font-semibold text-white">
                        {s.value}%
                      </span>
                    </div>
                  </div>
                  <div className="w-12 text-[9px] text-dr-mid flex-shrink-0 text-right">
                    {dropoff ? `−${dropoff}%` : ""}
                  </div>
                </div>
              );
            })}
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
