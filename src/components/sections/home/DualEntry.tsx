import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DualEntry() {
  const t = await getTranslations("home.choice");
  return (
    <div className="bg-dr-white border-b border-dr-border">
      {/* Bridge header */}
      <div className="text-center pt-9 px-10">
        <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2.5">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[26px] font-light text-dr-ink leading-[1.3]">
          {t.rich("title", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-9 border-t-0">
        <Link
          href="/skin"
          className="relative overflow-hidden cursor-pointer flex flex-col justify-end p-9 md:p-12 no-underline text-inherit transition-all hover:brightness-97"
          style={{ background: "linear-gradient(160deg,#F5F0EE 0%,#EDE5E0 100%)" }}
        >
          <div className="absolute right-12 top-12 w-[100px] h-[100px] border border-[rgba(200,16,46,0.1)] rounded-full">
            <div className="absolute inset-[18px] border border-[rgba(200,16,46,0.06)] rounded-full" />
          </div>
          <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-3">
            {t("skinTag")}
          </div>
          <div className="font-serif text-[38px] font-light text-dr-ink leading-[1.1] mb-3">
            {t("skinTitle")}
          </div>
          <div className="text-[14px] font-light text-dr-mid leading-[1.7] mb-5 max-w-[320px]">
            {t("skinDesc")}
          </div>
          <div className="mt-4 text-[13px] text-dr-mid leading-[1.7] border-t border-[rgba(0,0,0,0.08)] pt-3.5">
            {t("skinFeed")}
          </div>
          <div className="mt-3.5 text-[12px] font-semibold tracking-[0.18em] uppercase text-dr-ink flex items-center gap-2.5 group-hover:text-dr-red transition-colors">
            {t("skinCta")}
          </div>
        </Link>
        <Link
          href="/healthspan"
          className="relative overflow-hidden cursor-pointer flex flex-col justify-end p-9 md:p-12 no-underline text-inherit transition-all hover:brightness-97 md:border-l border-t md:border-t-0 border-dr-border"
          style={{ background: "linear-gradient(160deg,#F0F0F0 0%,#E8E5E2 100%)" }}
        >
          <div className="absolute right-12 top-12 w-[100px] h-[100px] border border-[rgba(200,16,46,0.1)] rounded-full">
            <div className="absolute inset-[18px] border border-[rgba(200,16,46,0.06)] rounded-full" />
          </div>
          <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-3">
            {t("healthTag")}
          </div>
          <div className="font-serif text-[38px] font-light text-dr-ink leading-[1.1] mb-3">
            {t("healthTitle")}
          </div>
          <div className="text-[14px] font-light text-dr-mid leading-[1.7] mb-5 max-w-[320px]">
            {t("healthDesc")}
          </div>
          <div className="mt-4 text-[13px] text-dr-mid leading-[1.7] border-t border-[rgba(0,0,0,0.08)] pt-3.5">
            {t("healthFeed")}
          </div>
          <div className="mt-3.5 text-[12px] font-semibold tracking-[0.18em] uppercase text-dr-ink flex items-center gap-2.5">
            {t("healthCta")}
          </div>
        </Link>
      </div>

      {/* Convergence bridge */}
      <div className="bg-dr-wine py-[18px] px-10 flex items-center justify-center gap-8 flex-wrap">
        <div className="text-center">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-[3px]">
            {t("bridgeSkinLabel")}
          </div>
          <div className="text-[13px] text-white/50">{t("bridgeSkinSub")}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
          <div className="w-2 h-2 border border-dr-red rotate-45 flex-shrink-0" />
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
        </div>
        <div className="text-center py-2 px-5 border border-white/8 bg-white/3">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dr-red mb-[3px]">
            {t("bridgeProfileLabel")}
          </div>
          <div className="text-[13px] text-white/50">{t("bridgeProfileSub")}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
          <div className="w-2 h-2 border border-dr-red rotate-45 flex-shrink-0" />
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
        </div>
        <div className="text-center">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-[3px]">
            {t("bridgeHealthLabel")}
          </div>
          <div className="text-[13px] text-white/50">{t("bridgeHealthSub")}</div>
        </div>
      </div>
    </div>
  );
}
