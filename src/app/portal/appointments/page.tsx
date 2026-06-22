import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { APPOINTMENTS } from "@/config/user-portal-mock";

const STATUS_STYLE: Record<string, string> = {
  upcoming: "text-dr-red border border-dr-red bg-[rgba(200,16,46,0.04)]",
  completed: "text-dr-mid border border-dr-border bg-dr-off",
  cancelled: "text-dr-mid border border-dr-border bg-dr-off line-through",
};

const STATUS_KEY: Record<string, string> = {
  upcoming: "appointments.statusUpcoming",
  completed: "appointments.statusCompleted",
  cancelled: "appointments.statusCancelled",
};

export default async function AppointmentsPage() {
  const t = await getTranslations("portal");
  const upcoming = APPOINTMENTS.filter((a) => a.status === "upcoming");
  const past = APPOINTMENTS.filter((a) => a.status !== "upcoming");

  return (
    <PortalShell
      pageTitle={t("appointments.pageTitle")}
      pageSub={t("appointments.pageSub")}
    >
      <div className="max-w-[760px]">
        <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
          <div>
              <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
                {t.rich("appointments.title", {
                  em: (chunks) => <em className="italic">{chunks}</em>,
                })}
              </h1>
            <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[480px]">
              {t("appointments.sub")}
            </p>
          </div>
          <Link
            href="/portal/clinic"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white bg-dr-red no-underline px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            {t("appointments.bookClinic")}
          </Link>
        </div>

        {/* Upcoming */}
        <div className="mb-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("appointments.upcoming")}
          </div>
          <div className="flex flex-col gap-2.5">
            {upcoming.length === 0 && (
              <div className="bg-dr-off border border-dr-border p-4 text-[12px] text-dr-mid">
                {t("appointments.emptyUpcoming")}
              </div>
            )}
            {upcoming.map((a) => (
              <div key={a.id} className="bg-dr-white border border-dr-border p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="text-center flex-shrink-0 pr-4 border-r border-dr-border min-w-[80px]">
                    <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid">
                      {a.date.split(" ")[0]}
                    </div>
                    <div className="font-serif text-[28px] font-light text-dr-ink leading-none mt-0.5">
                      {a.date.split(" ")[1]}
                    </div>
                    <div className="text-[10px] text-dr-mid mt-1">{a.time}</div>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-red mb-1">
                      {a.type}
                    </div>
                    <div className="text-[14px] text-dr-ink leading-tight">{a.clinic}</div>
                    <div className="text-[11px] text-dr-mid mt-0.5">{a.doctor}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                    <span
                      className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${STATUS_STYLE[a.status]}`}
                    >
                      {t(STATUS_KEY[a.status] as never)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="text-[9px] font-semibold tracking-[0.12em] uppercase text-dr-ink border border-dr-border px-2.5 py-1 cursor-pointer hover:border-dr-mid transition-colors"
                      >
                        {t("common.reschedule")}
                      </button>
                      <button
                        type="button"
                        className="text-[9px] font-semibold tracking-[0.12em] uppercase text-dr-mid px-2.5 py-1 cursor-pointer hover:text-dr-red transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-3 flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-mid" />
              {t("appointments.past")}
            </div>
            <div className="flex flex-col gap-2.5">
              {past.map((a) => (
                <div
                  key={a.id}
                  className="bg-dr-off border border-dr-border p-4 opacity-80"
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="text-center flex-shrink-0 pr-4 border-r border-dr-border min-w-[80px]">
                      <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid">
                        {a.date.split(" ")[0]}
                      </div>
                      <div className="font-serif text-[22px] font-light text-dr-mid leading-none mt-0.5">
                        {a.date.split(" ")[1]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-mid mb-1">
                        {a.type}
                      </div>
                      <div className="text-[13px] text-dr-ink leading-tight">{a.clinic}</div>
                      <div className="text-[11px] text-dr-mid mt-0.5">{a.doctor}</div>
                    </div>
                    <span
                      className={`text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 ${STATUS_STYLE[a.status]}`}
                    >
                      {t(STATUS_KEY[a.status] as never)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
