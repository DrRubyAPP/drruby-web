import { getTranslations } from "next-intl/server";

export default async function BrennerQuote() {
  const t = await getTranslations("healthspan.brennerQuote");
  return (
    <section className="bg-dr-ink py-12 px-14 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-r from-transparent to-[rgba(200,16,46,0.06)] pointer-events-none" />
      <div className="max-w-[760px]">
        <blockquote className="font-serif text-[26px] font-light text-white leading-[1.55] mb-5">
          &ldquo;{t("quote")}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-px bg-dr-red" />
          <div>
            <div className="text-[13px] font-semibold text-white tracking-[0.15em] uppercase">
              {t("name")}
            </div>
            <div className="text-[12px] text-white/35 mt-0.5">{t("role")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
