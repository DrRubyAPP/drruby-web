import { getTranslations } from "next-intl/server";

export default async function N1Philosophy() {
  const t = await getTranslations("home.n1");
  return (
    <section className="bg-[#EEECEA] py-14 md:py-[72px] px-6 md:px-18">
      <div className="text-center mb-10 md:mb-14">
        <div className="text-[14px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3.5">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[34px] md:text-[56px] font-semibold text-dr-ink leading-[1.08]">
          {t.rich("title", {
            em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-dr-border">
        <div className="bg-dr-white p-8 md:p-10 md:px-9">
          <div className="font-serif text-[52px] md:text-[64px] font-semibold text-[rgba(200,16,46,0.55)] leading-none mb-5">
            {t("col1Num")}
          </div>
          <div className="font-serif text-[22px] font-semibold text-dr-ink mb-3 leading-[1.3]">
            {t("col1Title")}
          </div>
          <div className="text-[16px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.85]">
            {t("col1Desc")}
          </div>
          <div className="text-[13px] font-semibold text-dr-red mt-5 tracking-[0.06em]">
            {t("col1Highlight")}
          </div>
        </div>
        <div className="bg-[#F5F4F2] p-8 md:p-10 md:px-9">
          <div className="font-serif text-[52px] md:text-[64px] font-semibold text-[rgba(200,16,46,0.55)] leading-none mb-5">
            {t("col2Num")}
          </div>
          <div className="font-serif text-[22px] font-semibold text-dr-ink mb-3 leading-[1.3]">
            {t("col2Title")}
          </div>
          <div className="text-[16px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.85]">
            {t("col2Desc")}
          </div>
          <div className="text-[13px] font-semibold text-dr-red mt-5 tracking-[0.06em]">
            {t("col2Highlight")}
          </div>
        </div>
        <div className="bg-dr-white p-8 md:p-10 md:px-9">
          <div className="font-serif text-[52px] md:text-[64px] font-semibold text-[rgba(200,16,46,0.55)] leading-none mb-5">
            {t("col3Num")}
          </div>
          <div className="font-serif text-[22px] font-semibold text-dr-ink mb-3 leading-[1.3]">
            {t("col3Title")}
          </div>
          <div className="text-[16px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.85]">
            {t("col3Desc")}
          </div>
          <div className="text-[13px] font-semibold text-dr-red mt-5 tracking-[0.06em]">
            {t("col3Highlight")}
          </div>
        </div>
      </div>
    </section>
  );
}
