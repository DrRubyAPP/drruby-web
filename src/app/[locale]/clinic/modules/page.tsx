import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import { CLINIC_MODULES, CURRENT_PLAN } from "@/config/clinic-portal-mock";

// Modules & Billing (spec §12): modular pricing — start with the basics,
// expand as you grow. Active/inactive toggles, current plan, usage.
export default async function ModulesPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("modules.pageTitle")}
      pageSub={t("modules.pageSub")}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("modules.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("modules.sub")}
          </p>
        </div>

        {/* Current plan */}
        <div className="bg-dr-ink p-5 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.6)] mb-1">
              {t("modules.currentPlanHeading")}
            </div>
            <div className="font-serif text-[24px] font-light text-white leading-tight">
              {CURRENT_PLAN.name} · {CURRENT_PLAN.price}
            </div>
            <div className="text-[10px] text-white/50 mt-1">
              {CURRENT_PLAN.activeModules} modules active
            </div>
          </div>
          <button
            type="button"
            className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white border border-white/20 px-3 py-1.5 cursor-pointer hover:border-white/40 transition-colors"
          >
            Manage Plan →
          </button>
        </div>

        {/* Usage */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("modules.usageHeading")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <UsageCard
              label={t("modules.usageAiReports")}
              value={CURRENT_PLAN.usage.aiReports}
            />
            <UsageCard
              label={t("modules.usageReferrals")}
              value={CURRENT_PLAN.usage.referrals}
            />
            <UsageCard
              label={t("modules.usageAppointments")}
              value={CURRENT_PLAN.usage.appointments}
            />
          </div>
        </div>

        {/* Modules table */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("modules.modulesHeading")}
          </div>
          <div className="flex flex-col gap-2">
            {CLINIC_MODULES.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-4 border border-dr-border flex-wrap"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[11px] font-medium text-dr-ink">
                    {m.name}
                  </div>
                  <div className="text-[10px] text-dr-mid mt-0.5">
                    {m.description}
                  </div>
                </div>
                <span
                  className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${
                    m.status === "active"
                      ? "text-dr-success bg-[rgba(31,158,90,0.1)]"
                      : "text-dr-mid bg-dr-off border border-dr-border"
                  }`}
                >
                  {m.status === "active"
                    ? t("modules.statusActive")
                    : t("modules.statusInactive")}
                </span>
                {m.status === "inactive" && (
                  <button
                    type="button"
                    className="text-[9px] font-semibold tracking-[0.14em] uppercase bg-dr-red text-white px-3 py-1.5 border-none cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {t("common.subscribe")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClinicShell>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-dr-border p-4">
      <div className="text-[8px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1.5">
        {label}
      </div>
      <div className="font-serif text-[22px] font-light text-dr-ink">{value}</div>
    </div>
  );
}
