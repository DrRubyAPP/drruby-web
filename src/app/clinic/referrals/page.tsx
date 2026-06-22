import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import {
  NEW_REFERRALS,
  toneForScore,
} from "@/config/clinic-portal-mock";

// DrRuby Referrals (spec §9): green-bordered cards, patient note + Index
// badges + Accept / View Profile. Accepting creates an appointment
// (suggested slot) and starts the referral-fee clock (settles post-visit).
export default async function ClinicReferralsPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("referrals.pageTitle")}
      pageSub={t("referrals.pageSub")}
    >
      <div className="max-w-[760px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("referrals.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("referrals.sub")}
          </p>
        </div>

        {/* New referrals */}
        <div className="bg-dr-white border border-dr-border border-t-[3px] border-t-dr-success p-5 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-success flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-success" />
              {t("workbench.newReferralsTitle")}
            </div>
            <span className="text-[8px] font-bold bg-dr-success text-white px-2 py-0.5 rounded-[2px]">
              {t("workbench.newReferralsBadge", { count: NEW_REFERRALS.length })}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {NEW_REFERRALS.map((r) => (
              <div
                key={r.id}
                className="border border-[rgba(31,158,90,0.15)] bg-[rgba(31,158,90,0.02)] p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                  <div>
                    <div className="text-[11px] font-medium text-dr-ink">
                      {r.patientName}
                    </div>
                    <div className="text-[9px] text-dr-mid mt-px">
                      Referred via DrRuby · {r.referredAt}
                    </div>
                  </div>
                  <span className="text-[8px] font-semibold text-dr-success border border-[rgba(31,158,90,0.3)] px-2 py-0.5">
                    {t("common.new")}
                  </span>
                </div>
                <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1.5">
                  {t("referrals.indicesLabel")}
                </div>
                <div className="flex gap-2 mb-2.5 flex-wrap">
                  {r.indices.map((idx) => {
                    const tone = toneForScore(idx.value);
                    return (
                      <div
                        key={idx.label}
                        className={`text-[9px] font-semibold px-2 py-0.5 ${
                          tone === "alert"
                            ? "bg-[rgba(200,16,46,0.07)] text-dr-red"
                            : tone === "warn"
                              ? "bg-[rgba(184,106,0,0.07)] text-dr-warn"
                              : "bg-[rgba(31,158,90,0.07)] text-dr-success"
                        }`}
                      >
                        {idx.label} {idx.value}
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1">
                  {t("referrals.patientNotesLabel")}
                </div>
                <div className="text-[10px] text-dr-ink italic leading-[1.6] mb-3">
                  {r.patientNotes}
                </div>
                <div className="text-[8px] text-[rgba(0,0,0,0.55)] mb-2.5">
                  ⚠ {t("dataPrivacy.referralFootnote")}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="bg-dr-red text-white text-[8px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 border-none cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {t("common.accept")}
                  </button>
                  <Link
                    href="/clinic/patients"
                    className="bg-dr-off text-dr-mid border border-dr-border text-[8px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5 no-underline hover:text-dr-ink transition-colors"
                  >
                    {t("common.viewProfile")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accepted referrals (empty state for MVP) */}
        <div className="bg-dr-off border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-mid" />
            {t("referrals.acceptedHeading")}
          </div>
          <div className="text-[11px] text-dr-mid">{t("referrals.noAccepted")}</div>
        </div>
      </div>
    </ClinicShell>
  );
}
