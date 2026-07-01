import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import MedicalDisclaimer from "@/components/common/MedicalDisclaimer";
import { CONNECTED_SOURCES, PORTAL_USER } from "@/config/user-portal-mock";

// §12.1 Health Profile — non-anxiety-inducing layout.
// Per §3 design principle: don't lead with scores. Frame as context, not judgement.
const PROFILE_FACTS = [
  { label: "Age range", value: "40–49" },
  { label: "Primary goal", value: "Hike with my grandkids without knee pain" },
  { label: "Tracking since", value: "Mar 2026" },
  { label: "Cycle stage", value: "Perimenopause · self-reported" },
];

const CONDITIONS = [
  { name: "Vitamin D deficiency", noted: "May 30", status: "monitor" },
  { name: "Mild breakouts (Domain D)", noted: "Ongoing", status: "monitor" },
  { name: "Sleep inconsistency", noted: "Jun 14", status: "improving" },
];

const SCORE_HISTORY = [
  { date: "Mar 10", label: "First scan", note: "Baseline established" },
  { date: "Apr 8", label: "+ hydration focus", note: "HA serum introduced" },
  { date: "May 6", label: "+ magnesium", note: "Sleep depth trend begins" },
  { date: "Jun 8", label: "Latest scan", note: "Barrier strengthening" },
];

const STATUS_STYLE: Record<string, string> = {
  monitor: "text-dr-warn",
  improving: "text-dr-success",
  alert: "text-dr-red",
};

const STATUS_KEY: Record<string, string> = {
  monitor: "profile.statusMonitor",
  improving: "profile.statusImproving",
  alert: "profile.statusAlert",
};

export default async function ProfilePage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("profile.pageTitle")}
      pageSub={t("profile.pageSub")}
    >
      <div className="max-w-[820px]">
        {/* Identity */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3 flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-[rgba(200,16,46,0.1)] flex items-center justify-center text-[18px] text-dr-red font-medium">
            {PORTAL_USER.initials}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-serif text-[22px] font-light text-dr-ink leading-tight">
              {PORTAL_USER.fullName}
            </div>
            <div className="text-[11px] text-dr-mid mt-0.5">{PORTAL_USER.email}</div>
          </div>
          <Link
            href="/portal/settings"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink no-underline border border-dr-border px-3 py-2 hover:border-dr-mid transition-colors"
          >
            {t("common.editSettings")}
          </Link>
        </div>

        {/* Facts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {PROFILE_FACTS.map((f) => (
            <div key={f.label} className="bg-dr-white border border-dr-border p-4">
              <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-2 flex items-center gap-2">
                <span className="block w-2.5 h-px bg-dr-red" />
                {f.label}
              </div>
              <div className="font-serif text-[18px] font-light text-dr-ink leading-[1.35]">
                {f.value}
              </div>
            </div>
          ))}
        </div>

        {/* Connected sources */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("profile.sourcesHeading")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CONNECTED_SOURCES.map((src) => (
              <div
                key={src.id}
                className="flex items-center gap-3 p-3 border border-dr-border"
              >
                <span className="text-[18px] flex-shrink-0">{src.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-dr-ink leading-tight">{src.name}</div>
                  <div className="text-[9px] text-dr-mid mt-0.5 capitalize">{src.status}</div>
                </div>
                {src.status === "connected" ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-dr-success flex-shrink-0" />
                ) : (
                  <button
                    type="button"
                    className="text-[9px] font-semibold tracking-[0.12em] uppercase text-dr-red cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    {t("common.connect")}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-dr-mid mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-dr-success" />
            {t("profile.sourcesFootnote")}
          </div>
        </div>

        {/* Conditions / patterns DrRuby is tracking */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("profile.trackingHeading")}
          </div>
          <div className="flex flex-col divide-y divide-dr-border">
            {CONDITIONS.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <div className="text-[12px] text-dr-ink leading-tight">{c.name}</div>
                  <div className="text-[9px] text-dr-mid mt-0.5">Noted {c.noted}</div>
                </div>
                <div className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${STATUS_STYLE[c.status]}`}>
                  {t(STATUS_KEY[c.status] as never)}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-dr-mid mt-3 leading-[1.6]">
            {t("profile.trackingFootnote")}
          </div>
        </div>

        {/* Score history — framed as a timeline of actions, not a leaderboard */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("profile.timelineHeading")}
          </div>
          <div className="flex flex-col gap-3">
            {SCORE_HISTORY.map((item, i) => (
              <div key={item.date} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-dr-red" />
                  {i < SCORE_HISTORY.length - 1 && (
                    <div className="w-px flex-1 bg-dr-border mt-1" />
                  )}
                </div>
                <div className="pb-3 last:pb-0">
                  <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-mid">
                    {item.date}
                  </div>
                  <div className="text-[12px] text-dr-ink leading-tight mt-0.5">{item.label}</div>
                  <div className="text-[10px] text-dr-mid mt-0.5">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <MedicalDisclaimer />
      </div>
    </PortalShell>
  );
}
