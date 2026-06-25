import { getTranslations } from "next-intl/server";

export default async function JenniferQuote() {
  const t = await getTranslations("home.quote");
  return (
    <section className="bg-dr-white grid grid-cols-1 md:grid-cols-2 gap-0">
      <div className="p-8 md:p-16 md:px-18 border-b md:border-b-0 md:border-r border-dr-border">
        <div className="text-[14px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-5">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[80px] md:text-[120px] leading-[0.5] text-[rgba(200,16,46,0.7)] mb-4">
          &ldquo;
        </div>
        <div className="font-serif text-[24px] md:text-[28px] font-medium italic text-dr-ink leading-[1.55] mb-7">
          {t.rich("text", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-[18px] text-[rgba(200,16,46,0.5)] flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#E8D8D0,#D0C0B8)" }}
          >
            J
          </div>
          <div>
            <div className="text-[14px] font-medium text-dr-ink">
              {t("who")}
            </div>
            <div className="text-[14px] text-dr-ink/70 mt-0.5">
              {t("title")}
            </div>
          </div>
        </div>
      </div>
      <div className="p-8 md:p-16 md:px-18 bg-dr-off">
        <div className="font-serif text-[24px] md:text-[28px] font-medium text-dr-ink mb-4 leading-[1.2]">
          {t.rich("n1Title", {
            em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
          })}
        </div>
        <div className="text-[14px] font-medium text-dr-ink/70 leading-[1.9] mb-7">
          {t("n1Desc")}
        </div>
        <div className="flex gap-8 md:gap-10 mt-3">
          <div>
            <div className="font-serif text-[44px] md:text-[64px] font-semibold text-dr-red leading-none">
              {t("stat1Val")}
            </div>
            <div className="text-[13px] font-semibold text-dr-ink mt-1.5 tracking-[0.12em] uppercase">
              {t("stat1Label")}
            </div>
          </div>
          <div>
            <div className="font-serif text-[44px] md:text-[64px] font-semibold text-dr-red leading-none">
              {t("stat2Val")}
            </div>
            <div className="text-[13px] font-semibold text-dr-ink mt-1.5 tracking-[0.12em] uppercase">
              {t("stat2Label")}
            </div>
          </div>
          <div>
            <div className="font-serif text-[44px] md:text-[64px] font-semibold text-dr-red leading-none">
              {t("stat3Val")}
            </div>
            <div className="text-[13px] font-semibold text-dr-ink mt-1.5 tracking-[0.12em] uppercase">
              {t("stat3Label")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
