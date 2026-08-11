import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { AccountSummary } from "@/components/sections/portal/settings/AccountSummary";
import { DeleteAccountDialog } from "@/components/sections/portal/settings/DeleteAccountDialog";
import { ExportDataButton } from "@/components/sections/portal/settings/ExportDataButton";

// §14.1 Local-first: data export/delete always available, no dark patterns.
// §7.4.1 Full legal disclaimer lives here (answer pages link to it).

const SHARED_CLINICS = [
  {
    name: "Clarity Skin Clinic",
    shared: "Skin scans + AI Reports",
    since: "Jun 2, 2026",
  },
  {
    name: "Meridian Women's Health",
    shared: "Hormonal patterns + Cycle data",
    since: "May 15, 2026",
  },
];

const TOGGLES = [
  {
    id: "proactive-insights",
    label: "Proactive insights (P0–P3)",
    desc: "DrRuby will push a notification when it detects a real pattern. Max 1 per 72h. Off = silent.",
    on: true,
  },
  {
    id: "apple-health",
    label: "Apple Health sync",
    desc: "Pull sleep, HRV, and cycle data from Apple Health. Stored on-device only.",
    on: true,
  },
  {
    id: "research-aggregate",
    label: "Anonymous research contribution",
    desc: "Allow your anonymized, aggregated data to inform N=1 research. Never identifies you.",
    on: false,
  },
];

export default async function SettingsPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("settings.pageTitle")}
      pageSub={t("settings.pageSub")}
    >
      <div className="max-w-[760px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("settings.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("settings.sub")}
          </p>
        </div>

        {/* Account */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.accountHeading")}
          </div>
          {/* 客户端岛：读 GET /api/me 只读身份 + 链到 Profile 编辑 */}
          <AccountSummary />
        </div>

        {/* Sharing controls — §14 */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.sharingHeading")}
          </div>
          <div className="flex flex-col divide-y divide-dr-border">
            {SHARED_CLINICS.map((c) => (
              <div
                key={c.name}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 flex-wrap"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[12px] text-dr-ink leading-tight">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-dr-mid mt-0.5">
                    Sharing: {c.shared} · since {c.since}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-[9px] font-semibold tracking-[0.14em] uppercase text-dr-red border border-dr-red px-2.5 py-1.5 cursor-pointer hover:bg-[rgba(200,16,46,0.04)] transition-colors flex-shrink-0"
                >
                  {t("common.revoke")}
                </button>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-dr-mid mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-dr-success" />
            {t("settings.sharingFootnote")}
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.preferencesHeading")}
          </div>
          <div className="flex flex-col divide-y divide-dr-border">
            {TOGGLES.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="text-[12px] text-dr-ink leading-tight">
                    {t.label}
                  </div>
                  <div className="text-[11px] text-dr-mid mt-1 leading-[1.6]">
                    {t.desc}
                  </div>
                </div>
                {/* Visual toggle (non-interactive in static render) */}
                <div
                  className={`relative w-8 h-[18px] rounded-full flex-shrink-0 mt-0.5 ${
                    t.on ? "bg-dr-red" : "bg-dr-border"
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all ${
                      t.on ? "left-[17px]" : "left-[3px]"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data ownership — §14.1 */}
        <div className="bg-dr-white border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.dataOwnershipHeading")}
          </div>
          <div className="flex flex-col gap-2.5">
            {/* 客户端岛：bearer blob 下载 GET /api/me/export */}
            <ExportDataButton />
            {/* 客户端岛：二次确认 → POST /api/me/delete → 清 token 跳登录 */}
            <DeleteAccountDialog />
          </div>
        </div>

        {/* Full legal disclaimer — §7.4.1 */}
        <div className="bg-dr-off border border-dr-border p-5 mb-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-mid" />
            {t("settings.disclaimerHeading")}
          </div>
          <div className="text-[11px] text-dr-ink leading-[1.8] space-y-2.5">
            <p>
              DrRuby provides health insights based on your personal data, not
              medical diagnoses. Always consult a qualified healthcare provider
              for medical concerns.
            </p>
            <p>
              DrRuby does not claim to diagnose, cure, treat, or prevent any
              disease. The Skin Health Intelligence Framework outputs
              pattern-based observations, not clinical determinations. Domain C
              (Structural Aging Signals) is intentionally not output in the MVP
              phase.
            </p>
            <p>
              DrRuby does not calculate or claim biological age, aging speed, or
              any age-anchored score. References to "baseline" or "patterns
              typical for women your age" refer to population reference ranges
              from the Brenner knowledge base, not a determination of your
              individual biological age.
            </p>
            <p>
              Supplement efficacy verdicts (CONTINUE / STOP / PARTIAL / TOO
              EARLY) are based on comparison to your personal baseline and
              Brenner-reviewed target indicators. They are not medical advice.
              Do not stop or start any medication or supplement based solely on
              DrRuby output — discuss with your healthcare provider.
            </p>
            <p>
              Your health data is stored locally on your device by default.
              Sharing with clinics or for anonymized research is opt-in and
              revocable. See{" "}
              <Link
                href="/portal/settings"
                className="text-dr-red underline underline-offset-2"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/portal/settings"
                className="text-dr-red underline underline-offset-2"
              >
                Terms of Service
              </Link>{" "}
              for full details.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-[#aaa] leading-[1.6] mt-2">
          {t("settings.footer")}
        </div>
      </div>
    </PortalShell>
  );
}
