import { getTranslations } from "next-intl/server";

export default async function BrennerQuote() {
  const t = await getTranslations("healthspan.brennerQuote");
  return (
    <section className="bg-[#EEECEA] py-12 px-7 md:px-14 relative overflow-hidden border-t border-b border-dr-border">
      <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-r from-transparent to-[rgba(200,16,46,0.05)] pointer-events-none" />
      <div className="max-w-[760px] relative">
        <blockquote className="font-serif text-[24px] md:text-[26px] font-medium text-dr-ink leading-[1.55] mb-5">
          &ldquo;{t("quote")}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-px bg-dr-red" />
          <div>
            <div className="text-[15px] font-semibold text-dr-ink tracking-[0.15em] uppercase">
              {t("name")}
            </div>
            <div className="text-[14px] text-[#111] mt-0.5">{t("role")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
