import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { PARTNER_CLINICS } from "@/config/user-portal-mock";

export default async function ClinicPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("clinic.pageTitle")}
      pageSub={t("clinic.pageSub")}
    >
      <div className="max-w-[860px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("clinic.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("clinic.sub")}
          </p>
        </div>

        {/* Share-data banner */}
        <div className="bg-dr-ink p-4 mb-4 flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[rgba(200,16,46,0.6)] mb-1.5 flex items-center gap-2">
              <span className="block w-2.5 h-px bg-[rgba(200,16,46,0.6)]" />
              {t("clinic.beforeYouBook")}
            </div>
            <div className="font-serif text-[16px] font-light text-white leading-[1.4]">
              {t("clinic.beforeYouBookDesc")}
            </div>
          </div>
          <Link
            href="/portal/settings"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white no-underline border border-white/20 px-3.5 py-2 hover:border-white/40 transition-colors flex-shrink-0"
          >
            {t("clinic.manageSharing")}
          </Link>
        </div>

        {/* Clinics list */}
        <div className="flex flex-col gap-3 mb-4">
          {PARTNER_CLINICS.map((c) => (
            <div key={c.id} className="bg-dr-white border border-dr-border p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-red mb-1">
                    {c.specialty}
                  </div>
                  <div className="font-serif text-[22px] font-light text-dr-ink leading-tight">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-dr-mid mt-1">
                    {c.location} · {c.distance}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-mid mb-1">
                    {t("clinic.nextAvailable")}
                  </div>
                  <div className="font-serif text-[20px] font-light text-dr-ink leading-tight">
                    {c.nextAvailable}
                  </div>
                  <div className="text-[10px] text-dr-mid mt-0.5">★ {c.rating.toFixed(1)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-dr-border">
                <button
                  type="button"
                  className="bg-dr-red text-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] uppercase border-none cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {t("common.book")}
                </button>
                <button
                  type="button"
                  className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink border border-dr-border px-4 py-2 cursor-pointer hover:border-dr-mid transition-colors"
                >
                  {t("clinic.viewProfile")}
                </button>
                <span className="text-[10px] text-dr-mid ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-dr-success" />
                  {t("clinic.sharingSupported")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Existing appointments link */}
        <div className="bg-dr-off border border-dr-border p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-1 flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-mid" />
              {t("clinic.alreadyBooked")}
            </div>
            <div className="text-[12px] text-dr-ink">
              {t("clinic.alreadyBookedDesc")}
            </div>
          </div>
          <Link
            href="/portal/appointments"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red no-underline hover:opacity-70 transition-opacity"
          >
            {t("clinic.goToAppointments")}
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}
