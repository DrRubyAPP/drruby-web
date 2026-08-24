import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DualEntry() {
  const t = await getTranslations("home.choice");
  return (
    <div
      className="border-b border-dr-border"
      style={{
        background:
          "linear-gradient(to bottom,#F0EEEB 0%,#F8F7F5 40%,#FFFFFF 100%)",
      }}
    >
      {/* Bridge header */}
      <div className="text-center pt-12 md:pt-14 pb-10 md:pb-13 px-6 md:px-10">
        <div className="flex items-center justify-center gap-4 md:gap-[18px] mb-5 md:mb-6">
          <div className="hidden sm:block w-10 md:w-14 h-px bg-dr-red" />
          <div className="text-[11px] font-bold tracking-[0.3em] uppercase text-dr-red">
            {t("eyebrow")}
          </div>
          <div className="hidden sm:block w-10 md:w-14 h-px bg-dr-red" />
        </div>
        <div className="font-serif text-[32px] md:text-[44px] font-semibold text-dr-ink leading-[1.2]">
          {t.rich("title", {
            em: (chunks) => (
              <em className="block italic font-medium text-dr-red mt-1">
                {chunks}
              </em>
            ),
          })}
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-dr-border">
        <Link
          href="/portal"
          className="group relative overflow-hidden cursor-pointer flex flex-col justify-start p-7 md:p-13 no-underline text-inherit transition-all hover:brightness-97"
          style={{
            background: "linear-gradient(160deg,#F5F0EE 0%,#EDE5E0 100%)",
          }}
        >
          <div className="absolute right-8 bottom-8 md:right-12 md:bottom-12 w-[80px] h-[80px] md:w-[100px] md:h-[100px] border border-[rgba(200,16,46,0.1)] rounded-full">
            <div className="absolute inset-[14px] md:inset-[18px] border border-[rgba(200,16,46,0.06)] rounded-full" />
          </div>
          <div className="text-[14px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-4">
            {t("skinTag")}
          </div>
          <div className="font-serif text-[32px] md:text-[42px] font-semibold text-dr-ink leading-[1.1] mb-4">
            {t("skinTitle")}
          </div>
          <div className="text-[16px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.8] mb-6 max-w-[400px]">
            {t("skinDesc")}
          </div>
          <div className="mt-4 text-[15px] font-normal text-dr-ink/70 leading-[1.7] border-t border-[rgba(0,0,0,0.08)] pt-3.5">
            {t("skinFeed")}
          </div>
          <div className="mt-4 text-[14px] font-semibold tracking-[0.18em] uppercase text-dr-ink flex items-center gap-2.5 group-hover:text-dr-red transition-colors">
            {t("skinCta")}
          </div>
        </Link>
        <Link
          href="/portal"
          className="group relative overflow-hidden cursor-pointer flex flex-col justify-start p-7 md:p-13 no-underline text-inherit transition-all hover:brightness-97 md:border-l border-t md:border-t-0 border-dr-border"
          style={{
            background: "linear-gradient(160deg,#F0F0F0 0%,#E8E5E2 100%)",
          }}
        >
          <div className="absolute right-8 bottom-8 md:right-12 md:bottom-12 w-[80px] h-[80px] md:w-[100px] md:h-[100px] border border-[rgba(200,16,46,0.1)] rounded-full">
            <div className="absolute inset-[14px] md:inset-[18px] border border-[rgba(200,16,46,0.06)] rounded-full" />
          </div>
          <div className="text-[14px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-4">
            {t("healthTag")}
          </div>
          <div className="font-serif text-[32px] md:text-[42px] font-semibold text-dr-ink leading-[1.1] mb-4">
            {t("healthTitle")}
          </div>
          <div className="text-[16px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.8] mb-6 max-w-[400px]">
            {t("healthDesc")}
          </div>
          <div className="mt-4 text-[15px] font-normal text-dr-ink/70 leading-[1.7] border-t border-[rgba(0,0,0,0.08)] pt-3.5">
            {t("healthFeed")}
          </div>
          <div className="mt-4 text-[14px] font-semibold tracking-[0.18em] uppercase text-dr-ink flex items-center gap-2.5 group-hover:text-dr-red transition-colors">
            {t("healthCta")}
          </div>
        </Link>
      </div>

      {/* Convergence bridge — light */}
      <div className="bg-[#F0EEEB] py-5 px-6 md:px-10 flex items-center justify-center gap-4 md:gap-8 flex-wrap border-t border-dr-border">
        <div className="text-center">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dr-ink/45 mb-[3px]">
            {t("bridgeSkinLabel")}
          </div>
          <div className="text-[13px] text-dr-ink/60">{t("bridgeSkinSub")}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
          <div className="w-2 h-2 border border-dr-red rotate-45 flex-shrink-0" />
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
        </div>
        <div className="text-center py-2 px-5 border border-dr-border bg-dr-white">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dr-red mb-[3px]">
            {t("bridgeProfileLabel")}
          </div>
          <div className="text-[13px] text-dr-ink/60">
            {t("bridgeProfileSub")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
          <div className="w-2 h-2 border border-dr-red rotate-45 flex-shrink-0" />
          <div className="w-10 h-px bg-[rgba(200,16,46,0.4)]" />
        </div>
        <div className="text-center">
          <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dr-ink/45 mb-[3px]">
            {t("bridgeHealthLabel")}
          </div>
          <div className="text-[13px] text-dr-ink/60">
            {t("bridgeHealthSub")}
          </div>
        </div>
      </div>
    </div>
  );
}
