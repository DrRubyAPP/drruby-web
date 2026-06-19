import Link from "next/link";
import { getTranslations } from "next-intl/server";
import HomeCaptureForm from "@/components/forms/HomeCaptureForm";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default async function Home() {
  const t = await getTranslations("home");
  const skinTags = t.raw("pathSkin.tags") as string[];
  const healthspanTags = t.raw("pathHealthspan.tags") as string[];

  return (
    <>
      <Navbar />

      {/* HERO */}
      <div className="bg-[radial-gradient(ellipse_at_60%_0%,#fce8eb_0%,#f5f5f5_65%)] dark:bg-[radial-gradient(ellipse_at_60%_0%,#2a1419_0%,#0f0f0f_65%)] min-h-screen flex items-center">
        <div className="max-w-[1100px] mx-auto py-20 px-5 md:px-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-dr-red-lt border border-[#f5b8c0] text-[#a00015] text-[13px] font-medium py-[7px] px-4 rounded-[20px] mb-8">
            <span className="text-dr-red text-[8px]">&#9679;</span>
            {t("hero.badge")}
          </div>

          <h1 className="text-[clamp(40px,5vw,68px)] font-bold tracking-[-2px] leading-[1.05] text-dr-fg mb-5 max-w-[800px]">
            {t.rich("hero.title", {
              br: () => <br />,
              em: (chunks) => (
                <em className="not-italic text-dr-red">{chunks}</em>
              ),
            })}
          </h1>

          <p className="text-[19px] text-[#555] dark:text-[#9a9a9a] mb-14 leading-relaxed max-w-[580px]">
            {t("hero.subtitle")}
          </p>

          {/* PATH CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[880px] mb-12">
            <Link
              href="/skin"
              className="bg-dr-surface border-2 border-dr-border rounded-[20px] py-9 px-8 no-underline text-inherit flex flex-col text-left hover:border-dr-red hover:shadow-[0_8px_40px_rgba(208,2,27,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-dr-red opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[13px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
                {t("pathSkin.eyebrow")}
              </div>
              <h2 className="text-[clamp(20px,2vw,26px)] font-bold tracking-tight leading-[1.2] text-dr-fg mb-3.5">
                {t.rich("pathSkin.title", {
                  em: (chunks) => (
                    <em className="italic text-dr-red">{chunks}</em>
                  ),
                })}
              </h2>
              <p className="text-[15px] text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-6 flex-1">
                {t("pathSkin.desc")}
              </p>
              <div className="flex flex-wrap gap-[7px] mb-7">
                {skinTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium bg-dr-off border border-dr-border py-1 px-3 rounded-[20px] text-[#555] dark:text-[#9a9a9a]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-dr-red py-3 px-[22px] rounded-lg self-start">
                {t("pathSkin.cta")}
              </span>
            </Link>

            <Link
              href="/healthspan"
              className="bg-dr-surface border-2 border-dr-border rounded-[20px] py-9 px-8 no-underline text-inherit flex flex-col text-left hover:border-dr-red hover:shadow-[0_8px_40px_rgba(208,2,27,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-dr-red opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[13px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
                {t("pathHealthspan.eyebrow")}
              </div>
              <h2 className="text-[clamp(20px,2vw,26px)] font-bold tracking-tight leading-[1.2] text-dr-fg mb-3.5">
                {t.rich("pathHealthspan.title", {
                  em: (chunks) => (
                    <em className="italic text-dr-red">{chunks}</em>
                  ),
                })}
              </h2>
              <p className="text-[15px] text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-6 flex-1">
                {t("pathHealthspan.desc")}
              </p>
              <div className="flex flex-wrap gap-[7px] mb-7">
                {healthspanTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium bg-dr-off border border-dr-border py-1 px-3 rounded-[20px] text-[#555] dark:text-[#9a9a9a]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-dr-red py-3 px-[22px] rounded-lg self-start">
                {t("pathHealthspan.cta")}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* CAPTURE */}
      <section className="bg-dr-black py-20 px-5 md:px-10" id="join-home">
        <HomeCaptureForm />
      </section>

      {/* PHILOSOPHY */}
      <section className="bg-dr-black py-20 px-5 md:px-10">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red-mid mb-3">
            {t("philosophy.eyebrow")}
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-tight text-white mb-3.5">
            {t.rich("philosophy.title", { br: () => <br /> })}
          </h2>
          <p className="text-[17px] text-[#aaa] max-w-[560px] leading-relaxed mb-12">
            {t("philosophy.subtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#127919;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">
                {t("philosophy.card1.title")}
              </div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                {t("philosophy.card1.body")}
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                {t("philosophy.card1.quote")}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#128246;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">
                {t("philosophy.card2.title")}
              </div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                {t("philosophy.card2.body")}
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                {t("philosophy.card2.quote")}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#128300;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">
                {t("philosophy.card3.title")}
              </div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                {t("philosophy.card3.body")}
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                {t("philosophy.card3.quote")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-dr-surface py-20 px-5 md:px-10 border-t border-dr-border">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
              {t("trust.eyebrow")}
            </div>
            <h2 className="text-[clamp(24px,3vw,38px)] font-bold tracking-tight leading-[1.2] text-dr-fg mb-3.5">
              {t.rich("trust.title", {
                em: (chunks) => (
                  <em className="italic text-dr-red">{chunks}</em>
                ),
              })}
            </h2>
            <p className="text-base text-[#666] dark:text-[#9a9a9a] leading-relaxed max-w-[400px]">
              {t("trust.body")}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 flex-shrink-0">
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">
                {t("trust.stat1.value")}
              </div>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                {t("trust.stat1.line1")}
                <br />
                {t("trust.stat1.line2")}
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">
                {t("trust.stat2.value")}
              </div>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                {t("trust.stat2.line1")}
                <br />
                {t("trust.stat2.line2")}
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">
                {t("trust.stat3.value")}
              </div>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                {t("trust.stat3.line1")}
                <br />
                {t("trust.stat3.line2")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
