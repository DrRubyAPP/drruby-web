import { getTranslations } from "next-intl/server";

export default async function N1Philosophy() {
  const t = await getTranslations("home.n1");
  return (
    <section className="bg-dr-wine py-14 md:py-[72px] px-6 md:px-18">
      <div className="text-center mb-10 md:mb-14">
        <div className="text-[12px] font-semibold tracking-[0.28em] uppercase text-[rgba(200,16,46,0.55)] mb-3.5">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[32px] md:text-[42px] font-light text-white leading-[1.15]">
          {t.rich("title", {
            em: (chunks) => <em className="italic text-[#F0C0C8]">{chunks}</em>,
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        <div className="bg-dr-wine p-7 md:p-10 md:px-9">
          <div className="font-serif text-[40px] md:text-[48px] font-light text-[rgba(200,16,46,0.2)] leading-none mb-5">
            {t("col1Num")}
          </div>
          <div className="font-serif text-[20px] font-light text-white mb-3 leading-[1.3]">
            {t("col1Title")}
          </div>
          <div className="text-[14px] font-light text-white/38 leading-[1.9]">
            {t("col1Desc")}
          </div>
          <div className="text-[13px] font-medium text-[rgba(200,16,46,0.6)] mt-4 tracking-[0.06em]">
            {t("col1Highlight")}
          </div>
        </div>
        <div className="bg-[#2A050B] p-7 md:p-10 md:px-9">
          <div className="font-serif text-[40px] md:text-[48px] font-light text-[rgba(200,16,46,0.2)] leading-none mb-5">
            {t("col2Num")}
          </div>
          <div className="font-serif text-[20px] font-light text-white mb-3 leading-[1.3]">
            {t("col2Title")}
          </div>
          <div className="text-[14px] font-light text-white/38 leading-[1.9]">
            {t("col2Desc")}
          </div>
          <div className="text-[13px] font-medium text-[rgba(31,158,90,0.6)] mt-4 tracking-[0.06em]">
            {t("col2Highlight")}
          </div>
        </div>
        <div className="bg-dr-wine p-7 md:p-10 md:px-9">
          <div className="font-serif text-[40px] md:text-[48px] font-light text-[rgba(200,16,46,0.2)] leading-none mb-5">
            {t("col3Num")}
          </div>
          <div className="font-serif text-[20px] font-light text-white mb-3 leading-[1.3]">
            {t("col3Title")}
          </div>
          <div className="text-[14px] font-light text-white/38 leading-[1.9]">
            {t("col3Desc")}
          </div>
          <div className="text-[13px] font-medium text-[rgba(200,16,46,0.6)] mt-4 tracking-[0.06em]">
            {t("col3Highlight")}
          </div>
        </div>
      </div>
    </section>
  );
}
