import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ACTIVE_INSIGHT,
  HOME_TRIGGERS,
  PORTAL_USER,
} from "@/config/user-portal-mock";
import ProactiveInsightStrip from "@/components/sections/portal/ProactiveInsightStrip";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function PortalHome() {
  const t = await getTranslations("portal");
  const greeting = getGreeting();

  const triggerCopy: Record<
    string,
    { index: string; title: string; subtitle: string; cta: string }
  > = {
    "skin-changed": {
      index: t("home.trigger1Index"),
      title: t("home.trigger1Title"),
      subtitle: t("home.trigger1Sub"),
      cta: t("home.trigger1Cta"),
    },
    "stack-worth": {
      index: t("home.trigger2Index"),
      title: t("home.trigger2Title"),
      subtitle: t("home.trigger2Sub"),
      cta: t("home.trigger2Cta"),
    },
    "feel-different": {
      index: t("home.trigger3Index"),
      title: t("home.trigger3Title"),
      subtitle: t("home.trigger3Sub"),
      cta: t("home.trigger3Cta"),
    },
  };

  return (
    <>
      {/* ① Greeting + ② Main question */}
      <div className="pt-2 pb-1">
        <div className="text-[12px] font-light tracking-[0.1em] text-dr-mid mb-2">
          {greeting}, {PORTAL_USER.firstName}
        </div>
        <h1 className="font-serif text-[42px] md:text-[48px] font-light text-dr-ink leading-[1.1]">
          {t.rich("home.headline", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </h1>
      </div>

      {/* ④ Proactive Insight Strip — only when triggered */}
      {ACTIVE_INSIGHT && <ProactiveInsightStrip insight={ACTIVE_INSIGHT} />}

      {/* ③ Three Trigger entries (fixed order) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        {HOME_TRIGGERS.map((trigger) => {
          const copy = triggerCopy[trigger.id];
          return (
            <Link
              key={trigger.id}
              href={trigger.href}
              className="group bg-dr-white border border-dr-border p-6 flex flex-col no-underline hover:border-dr-red transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-dr-red">
                  Trigger {copy.index}
                </span>
                {trigger.comingSoon && (
                  <span className="text-[8px] font-semibold tracking-[0.14em] uppercase text-dr-mid border border-dr-border px-2 py-0.5">
                    {t("home.comingSoon")}
                  </span>
                )}
              </div>
              <div className="font-serif text-[26px] font-light text-dr-ink leading-[1.15] mb-2">
                {copy.title}
              </div>
              <div className="text-[12px] text-dr-mid leading-[1.6] mb-6 flex-1">
                {copy.subtitle}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-dr-ink flex items-center gap-2 group-hover:text-dr-red transition-colors">
                {copy.cta}
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* §3.3 Other home features — gentle nudges, not dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            Your goal
          </div>
          <div className="font-serif text-[20px] font-light italic text-dr-ink leading-[1.4]">
            “Hike with my grandkids without my knees giving out.”
          </div>
          <div className="text-[11px] text-dr-mid mt-3">
            You set this on Jun 2. DrRuby tracks progress toward this — not
            daily streaks.
          </div>
        </div>
        <div className="bg-dr-ink p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.6)] mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-[rgba(200,16,46,0.6)]" />
            From Dr. Brenner
          </div>
          <div className="font-serif text-[16px] font-light italic text-white/80 leading-[1.6]">
            “Sleep consistency beats sleep duration. Same bedtime every night —
            even on weekends — does more for recovery than an extra hour.”
          </div>
          <div className="text-[10px] text-white/30 mt-3">
            Charles Brenner · Chief Scientific Advisor
          </div>
        </div>
      </div>

      {/* Monthly reflection nudge */}
      <div className="bg-dr-off border border-dr-border p-5">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2">
          Monthly reflection · Jun 2026
        </div>
        <div className="font-serif text-[18px] font-light text-dr-ink leading-[1.4] mb-2">
          Is tracking still helping you — or has it started to replace the goal
          itself?
        </div>
        <div className="text-[11px] text-dr-mid">
          You've used DrRuby 12 days this month. That's enough. Consider logging
          one real-life win instead of a data point this week.
        </div>
      </div>
    </>
  );
}
