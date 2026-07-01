import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { PORTAL_PRODUCTS } from "@/config/user-portal-mock";

const PLANS = [
  {
    name: "DrRuby Core",
    price: "$20/mo",
    tag: "Included",
    features: [
      "Skin Health Intelligence — Domains A, B, D, E",
      "Personal Coach with Intervention Graph logging",
      "Quarterly AI Reports",
      "Apple Health / Health Connect sync",
    ],
    current: true,
  },
  {
    name: "DrRuby Pro",
    price: "$49/mo",
    tag: "Upgrade",
    features: [
      "Everything in Core",
      "Domain C (Structural) when released",
      "Monthly AI Reports + PDF export",
      "Priority proactive insights (P0–P1)",
      "SkinScope hardware integration",
    ],
    current: false,
  },
];

export default async function ProductsPage() {
  const t = await getTranslations("portal");
  const inUse = PORTAL_PRODUCTS.filter((p) => p.inUse);
  const upgrades = PORTAL_PRODUCTS.filter((p) => !p.inUse);

  return (
    <PortalShell
      pageTitle={t("products.pageTitle")}
      pageSub={t("products.pageSub")}
    >
      <div className="max-w-[860px]">
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("products.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("products.sub")}
          </p>
        </div>

        {/* In use */}
        <div className="mb-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("products.inStack")}
          </div>
          <div className="flex flex-col gap-2.5">
            {inUse.map((p) => (
              <div
                key={p.id}
                className="bg-dr-white border border-dr-border p-4 flex items-center gap-3"
              >
                <span className="text-[24px] flex-shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-dr-ink leading-tight">{p.name}</div>
                  <div className="text-[11px] text-dr-mid mt-0.5">{p.reason}</div>
                </div>
                {p.match !== null && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-[8px] font-semibold tracking-[0.16em] uppercase text-dr-mid">
                      {t("products.match")}
                    </div>
                    <div className="font-serif text-[20px] font-light text-dr-red leading-none">
                      {p.match}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade / add-ons */}
        {upgrades.length > 0 && (
          <div className="mb-5">
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-3 flex items-center gap-2">
              <span className="block w-2.5 h-px bg-dr-mid" />
              {t("products.worthConsidering")}
            </div>
            <div className="flex flex-col gap-2.5">
              {upgrades.map((p) => (
                <div
                  key={p.id}
                  className={`bg-dr-white border p-4 flex items-center gap-3 ${
                    p.isUpgrade ? "border-l-2 border-l-dr-red border-dr-border" : "border-dr-border"
                  }`}
                >
                  <span className="text-[24px] flex-shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-dr-ink leading-tight">{p.name}</div>
                    <div className="text-[11px] text-dr-mid mt-0.5">{p.reason}</div>
                  </div>
                  {p.price && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red">
                        {p.price}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="mb-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("products.plansHeading")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-dr-white border p-5 flex flex-col ${
                  plan.current ? "border-dr-red" : "border-dr-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-red mb-1">
                      {plan.tag}
                    </div>
                    <div className="font-serif text-[22px] font-light text-dr-ink leading-tight">
                      {plan.name}
                    </div>
                  </div>
                  {plan.current && (
                    <span className="text-[8px] font-bold tracking-[0.14em] uppercase bg-dr-red text-white px-2 py-1">
                      Current
                    </span>
                  )}
                </div>
                <div className="font-serif text-[26px] font-light text-dr-ink mb-3">
                  {plan.price}
                </div>
                <ul className="text-[11px] text-dr-ink leading-[1.8] space-y-1 flex-1">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={plan.current}
                  className={`mt-4 text-[10px] font-semibold tracking-[0.14em] uppercase px-4 py-2.5 border-none cursor-pointer ${
                    plan.current
                      ? "bg-dr-off text-dr-mid cursor-not-allowed"
                      : "bg-dr-red text-white hover:opacity-90 transition-opacity"
                  }`}
                >
                  {plan.current ? t("products.currentPlan") : t("common.upgrade")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save money strip — §7 SaveCard philosophy applied */}
        <div className="bg-dr-off border border-dr-border p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5">
            <span className="text-[16px] flex-shrink-0">💡</span>
            <div>
              <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-1">
                {t("common.saveMoney")}
              </div>
              <div className="text-[12px] text-dr-ink leading-[1.6] max-w-[480px]">
                {t("products.saveMoneyDesc")}
              </div>
            </div>
          </div>
          <Link
            href="/portal/coach"
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red no-underline hover:opacity-70 transition-opacity flex-shrink-0"
          >
            {t("products.evaluateStack")}
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}
