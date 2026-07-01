import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  APPOINTMENTS_TODAY_META,
  TODAY_APPOINTMENTS,
} from "@/config/clinic-portal-mock";

// Appointments (spec §6): DrRuby referrals auto-inbound, multi-dim
// scheduling by doctor + machine, treatment reminders. The list view
// uses the time-axis pattern from spec §6.2.
export default async function ClinicAppointmentsPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("appointments.pageTitle")}
      pageSub={t("appointments.pageSub")}
    >
      <div className="max-w-[820px]">
        <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
              {t.rich("appointments.title", {
                em: (chunks) => <em className="italic">{chunks}</em>,
              })}
            </h1>
            <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
              {t("appointments.sub")}
            </p>
          </div>
          <Link
            href="#"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink border border-dr-border no-underline px-4 py-2.5 hover:border-dr-mid transition-colors"
          >
            {t("appointments.calendarCta")}
          </Link>
        </div>

        {/* Day meta */}
        <div className="bg-dr-white border border-dr-border p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-dr-ink">
            <strong>Wednesday, Jun 10</strong>
            <span className="text-dr-mid ml-2">
              {t("appointments.todayMeta", {
                total: APPOINTMENTS_TODAY_META.total,
                remaining: APPOINTMENTS_TODAY_META.remaining,
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <select className="text-[10px] text-dr-ink border border-dr-border bg-dr-white px-2.5 py-1.5 cursor-pointer">
              <option>All doctors</option>
              <option>Dr. Sarah Williams</option>
              <option>Dr. James Lee</option>
            </select>
            <select className="text-[10px] text-dr-ink border border-dr-border bg-dr-white px-2.5 py-1.5 cursor-pointer">
              <option>All machines</option>
              <option>DermaScope Pro</option>
              <option>Laser X-3</option>
            </select>
          </div>
        </div>

        {/* Time-axis list (spec §6.2) */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="flex flex-col gap-2">
            {TODAY_APPOINTMENTS.map((a) => {
              const isDone = a.state === "done";
              const isNow = a.state === "now";
              return (
                <div
                  key={a.id}
                  className={`flex gap-3 items-center p-3.5 ${
                    isDone
                      ? "bg-dr-off opacity-40"
                      : isNow
                        ? "bg-[rgba(200,16,46,0.04)] border-l-2 border-l-dr-red"
                        : "bg-dr-off"
                  }`}
                >
                  <div className="font-serif text-[16px] text-dr-ink font-light min-w-[48px] text-center border-r border-dr-border pr-3">
                    {a.time}
                    <small className="block text-[8px] text-dr-mid font-sans tracking-[0.1em]">
                      {a.meridiem}
                    </small>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-dr-ink">
                      {a.patientName}
                    </div>
                    <div className="text-[9px] text-dr-mid">
                      {a.type.includes("Now") ? (
                        <>
                          {a.type.split(" · ")[0]} ·{" "}
                          <span className="text-dr-red font-semibold">
                            {t("appointments.now")}
                          </span>
                        </>
                      ) : a.isDrRubyReferral ? (
                        <>
                          {a.type.split(" · ")[0]} ·{" "}
                          <span className="text-dr-success font-medium">
                            {t("appointments.drRubyReferral")}
                          </span>
                        </>
                      ) : (
                        a.type
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {isDone ? (
                      <span className="text-[8px] font-semibold tracking-[0.1em] uppercase text-dr-mid border border-dr-border px-2 py-1">
                        {t("appointments.done")}
                      </span>
                    ) : isNow ? (
                      <button
                        type="button"
                        className="bg-dr-red text-white text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 border-none cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        {t("common.start")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="bg-dr-off text-dr-mid border border-dr-border text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 cursor-pointer hover:text-dr-ink transition-colors"
                      >
                        {t("common.view")}
                      </button>
                    )}
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
