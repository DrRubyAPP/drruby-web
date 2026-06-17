import { getTranslations } from "next-intl/server";
import PageSwitcher from "@/components/common/PageSwitcher";
import WaitlistForm from "@/components/forms/WaitlistForm";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

interface ConcernOption {
  label: string;
  value: string;
}

export default async function SkinPage() {
  const t = await getTranslations("skin");
  const ageOptions = t.raw("form.ageOptions") as string[];
  const concerns = t.raw("form.concerns") as ConcernOption[];

  return (
    <>
      <PageSwitcher />
      <Navbar variant="sub" />

      {/* SUB-HERO */}
      <div className="bg-[radial-gradient(ellipse_at_70%_0%,#fce8eb_0%,#f5f5f5_65%)] dark:bg-[radial-gradient(ellipse_at_70%_0%,#2a1419_0%,#0f0f0f_65%)] min-h-[80vh] flex items-center">
        <div className="max-w-[1100px] mx-auto py-20 px-5 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-dr-red-lt border border-[#f5b8c0] text-[#a00015] text-[13px] font-medium py-[7px] px-4 rounded-[20px] mb-8">
              <span className="text-dr-red text-[8px]">&#9679;</span>
              {t("hero.badge")}
            </div>
            <h1 className="text-[clamp(36px,4vw,56px)] font-bold tracking-[-1.5px] leading-[1.08] text-dr-fg mb-[18px]">
              {t.rich("hero.title", {
                em: (chunks) => (
                  <em className="italic text-dr-red">{chunks}</em>
                ),
              })}
            </h1>
            <p className="text-[18px] text-[#555] dark:text-[#9a9a9a] mb-8 leading-relaxed max-w-[460px]">
              {t("hero.subtitle")}
            </p>
            <a
              href="#join-skin"
              className="bg-dr-red text-white py-[14px] px-7 rounded-[10px] text-base font-semibold no-underline inline-block hover:opacity-85 transition-opacity"
            >
              {t("hero.cta")}
            </a>
          </div>

          {/* BIOMARKER CARD */}
          <div className="hidden md:block bg-dr-black rounded-[20px] p-7">
            <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-dr-red-mid mb-5">
              {t("biomarker.heading")}
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  {t("biomarker.inflammationName")}
                </div>
                <div className="text-xs text-white/50">
                  {t("biomarker.inflammationDesc")}
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-red-mid">
                38
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-[rgba(77,201,138,0.15)] text-dr-green">
                &darr; 12%
              </span>
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  {t("biomarker.collagenName")}
                </div>
                <div className="text-xs text-white/50">
                  {t("biomarker.collagenDesc")}
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-green">
                71
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-white/8 text-white/60">
                {t("biomarker.stable")}
              </span>
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  {t("biomarker.pigmentName")}
                </div>
                <div className="text-xs text-white/50">
                  {t("biomarker.pigmentDesc")}
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-amber">
                24
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-[rgba(77,201,138,0.15)] text-dr-green">
                &darr; 6%
              </span>
            </div>
            <div className="border-l-3 border-l-dr-red bg-[rgba(208,2,27,0.08)] rounded-r-lg py-3 px-4 text-[13px] italic text-white/75 leading-relaxed">
              {t("biomarker.quote")}
            </div>
          </div>
        </div>
      </div>

      {/* MEASURE */}
      <section className="py-20 bg-dr-surface">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            {t("measure.eyebrow")}
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-fg mb-3">
            {t.rich("measure.title", {
              em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
            })}
          </h2>
          <p className="text-[17px] text-[#666] dark:text-[#9a9a9a] max-w-[540px] leading-relaxed mb-12">
            {t("measure.subtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-red-lt text-dr-red">
                {t("measure.card1.tag")}
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                {t("measure.card1.title")}
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                {t("measure.card1.desc")}
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                {t("measure.card1.tells")}
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-green-bg text-dr-green-text">
                {t("measure.card2.tag")}
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                {t("measure.card2.title")}
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                {t("measure.card2.desc")}
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                {t("measure.card2.tells")}
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-amber-bg text-dr-amber-text">
                {t("measure.card3.tag")}
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                {t("measure.card3.title")}
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                {t("measure.card3.desc")}
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                {t("measure.card3.tells")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="py-20 bg-dr-off">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            {t("proof.eyebrow")}
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-fg mb-3">
            {t.rich("proof.title", {
              em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
            })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-dr-surface border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-fg leading-relaxed mb-4">
                {t.rich("proof.t1.quote", {
                  strong: (chunks) => (
                    <strong className="not-italic text-dr-red">{chunks}</strong>
                  ),
                })}
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                {t("proof.t1.author")}
              </div>
            </div>
            <div className="bg-dr-surface border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-fg leading-relaxed mb-4">
                {t.rich("proof.t2.quote", {
                  strong: (chunks) => (
                    <strong className="not-italic text-dr-red">{chunks}</strong>
                  ),
                })}
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                {t("proof.t2.author")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section
        className="py-20 bg-dr-surface border-t border-dr-border"
        id="join-skin"
      >
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <WaitlistForm
            title={t.rich("form.title", {
              em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
            })}
            subtitle={t("form.subtitle")}
            ageOptions={ageOptions}
            concerns={concerns}
            showSpend
            formId="skin"
          />
        </div>
      </section>

      <Footer variant="sub" />
    </>
  );
}
