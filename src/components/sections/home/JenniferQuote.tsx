import { getTranslations } from "next-intl/server";

export default async function JenniferQuote() {
  const t = await getTranslations("home.quote");
  return (
    <section className="bg-dr-white grid grid-cols-1 md:grid-cols-2 gap-0">
      <div className="p-8 md:p-16 md:px-18 border-r border-dr-border">
        <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-5">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[64px] md:text-[80px] leading-[0.6] text-[rgba(200,16,46,0.12)] mb-3">
          &ldquo;
        </div>
        <div className="font-serif text-[20px] md:text-[22px] font-light italic text-dr-ink leading-[1.6] mb-6">
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
            <div className="text-[12px] text-dr-mid mt-0.5">{t("title")}</div>
          </div>
        </div>
      </div>
      <div className="p-8 md:p-16 md:px-18 bg-dr-off">
        <div className="font-serif text-[24px] md:text-[28px] font-light text-dr-ink mb-4 leading-[1.2]">
          {t.rich("n1Title", {
            em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
          })}
        </div>
        <div className="text-[14px] font-light text-dr-mid leading-[1.9] mb-7">
          {t("n1Desc")}
        </div>
        <div className="flex gap-6 md:gap-8 mt-2">
          <div>
            <div className="font-serif text-[28px] md:text-[36px] font-light text-dr-ink">
              {t("stat1Val")}
            </div>
            <div className="text-[12px] text-dr-mid mt-0.5 tracking-[0.06em]">
              {t("stat1Label")}
            </div>
          </div>
          <div>
            <div className="font-serif text-[28px] md:text-[36px] font-light text-dr-ink">
              {t("stat2Val")}
            </div>
            <div className="text-[12px] text-dr-mid mt-0.5 tracking-[0.06em]">
              {t("stat2Label")}
            </div>
          </div>
          <div>
            <div className="font-serif text-[28px] md:text-[36px] font-light text-dr-ink">
              {t("stat3Val")}
            </div>
            <div className="text-[12px] text-dr-mid mt-0.5 tracking-[0.06em]">
              {t("stat3Label")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
