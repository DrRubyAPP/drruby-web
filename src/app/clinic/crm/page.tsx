import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";

// CRM & Follow-up (spec §8) — MVP keeps it manual-friendly: shows the
// automation rules and any upcoming follow-ups queued. Auto rules fire
// 3/7 days post-treatment, last session, and 30-day reactivation.
export default async function CrmPage() {
  const t = await getTranslations("clinic");

  const rules = [
    { label: t("crm.day3"), desc: "Care message + photo reminder" },
    { label: t("crm.day7"), desc: "Follow-up task + effect comparison request" },
    { label: t("crm.lastSession"), desc: "Package renewal nudge" },
    { label: t("crm.reactivation"), desc: "30-day recall message" },
  ];

  return (
    <ClinicShell
      pageTitle={t("crm.pageTitle")}
      pageSub={t("crm.pageSub")}
    >
      <div className="max-w-[760px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("crm.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("crm.sub")}
          </p>
        </div>

        {/* Automation rules */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            Automation rules
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map((r) => (
              <div key={r.label} className="border border-dr-border p-3.5">
                <div className="text-[10px] font-semibold text-dr-ink mb-1">
                  {r.label}
                </div>
                <div className="text-[10px] text-dr-mid">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming follow-ups (empty state for MVP) */}
        <div className="bg-dr-off border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-mid" />
            {t("crm.upcomingHeading")}
          </div>
          <div className="text-[11px] text-dr-mid">{t("crm.noUpcoming")}</div>
        </div>
      </div>
    </ClinicShell>
  );
}
