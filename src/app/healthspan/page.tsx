import { getTranslations } from "next-intl/server";
import WaitlistForm from "@/components/forms/WaitlistForm";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

interface ConcernOption {
  label: string;
  value: string;
}

export default async function HealthspanPage() {
  const t = await getTranslations("healthspan");
  const goals = t.raw("hero.goals") as string[];
  const ageOptions = t.raw("form.ageOptions") as string[];
  const concerns = t.raw("form.concerns") as ConcernOption[];

  return (
    <>
      <Navbar />

      {/* SUB-HERO */}
      <div className="bg-[radial-gradient(ellipse_at_30%_0%,#fce8eb_0%,#f5f5f5_65%)] dark:bg-[radial-gradient(ellipse_at_30%_0%,#2a1419_0%,#0f0f0f_65%)] min-h-[80vh] flex items-center">
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

            {/* GOALS */}
            <div className="flex flex-col mb-8">
              {goals.map((goal) => (
                <div
                  key={goal}
                  className="flex items-center gap-3 py-3 border-b border-dr-border text-base italic text-[#555] dark:text-[#9a9a9a] last:border-b-0"
                >
                  <span className="text-dr-red not-italic font-bold">
                    &rarr;
                  </span>
                  {goal}
                </div>
              ))}
            </div>

            <a
              href="#join-healthspan"
              className="bg-dr-red text-white py-[14px] px-7 rounded-[10px] text-base font-semibold no-underline inline-block hover:opacity-85 transition-opacity"
            >
              {t("hero.cta")}
            </a>
          </div>

          {/* HEALTHSPAN INDEX CARD */}
          <div className="hidden md:block bg-dr-surface border border-dr-border rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
              {t("snapshot.heading")}
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#8635;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-fg mb-0.5">
                  {t("snapshot.hormonalName")}
                </div>
                <div className="text-xs italic text-dr-muted">
                  {t("snapshot.hormonalQuestion")}
                </div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-red-lt text-dr-red">
                {t("snapshot.hormonalStatus")}
              </span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#8593;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-fg mb-0.5">
                  {t("snapshot.recoveryName")}
                </div>
                <div className="text-xs italic text-dr-muted">
                  {t("snapshot.recoveryQuestion")}
                </div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-green-bg text-dr-green-text">
                {t("snapshot.recoveryStatus")}
              </span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#9672;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-fg mb-0.5">
                  {t("snapshot.inflammagingName")}
                </div>
                <div className="text-xs italic text-dr-muted">
                  {t("snapshot.inflammagingQuestion")}
                </div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-red-lt text-dr-red">
                {t("snapshot.inflammagingStatus")}
              </span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 mb-4">
              <span className="text-xl flex-shrink-0 w-7">&#9673;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-fg mb-0.5">
                  {t("snapshot.sleepName")}
                </div>
                <div className="text-xs italic text-dr-muted">
                  {t("snapshot.sleepQuestion")}
                </div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-[#f0f0f0] text-dr-muted">
                {t("snapshot.sleepStatus")}
              </span>
            </div>
            <div className="border-l-3 border-l-dr-red bg-dr-red-lt rounded-r-lg py-3 px-4 text-[13px] italic text-[#a00015] leading-relaxed">
              {t("snapshot.quote")}
            </div>
          </div>
        </div>
      </div>

      {/* TRACK */}
      <section className="py-20 bg-dr-surface">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            {t("track.eyebrow")}
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-fg mb-3">
            {t.rich("track.title", {
              em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
            })}
          </h2>
          <p className="text-[17px] text-[#666] dark:text-[#9a9a9a] max-w-[540px] leading-relaxed mb-12">
            {t("track.subtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(["card1", "card2", "card3", "card4"] as const).map((card) => (
              <div
                key={card}
                className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors"
              >
                <div className="text-xl italic font-semibold text-dr-fg mb-2.5">
                  {t(`track.${card}.question`)}
                </div>
                <div className="text-[11px] font-bold tracking-[1px] uppercase text-dr-red mb-2.5">
                  {t(`track.${card}.name`)}
                </div>
                <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3">
                  {t(`track.${card}.body`)}
                </p>
                <div className="text-[13px] text-dr-muted leading-relaxed">
                  <strong className="font-semibold text-[#555] dark:text-[#9a9a9a]">
                    {t("track.signalsLabel")}
                  </strong>{" "}
                  {t(`track.${card}.signals`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY STRIP */}
      <div className="bg-dr-red py-14">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:border-r md:border-white/20 md:pr-8">
            <div className="text-base font-bold text-white mb-2">
              {t("strip.card1.title")}
            </div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              {t("strip.card1.body")}
            </p>
          </div>
          <div className="md:border-r md:border-white/20 md:pr-8">
            <div className="text-base font-bold text-white mb-2">
              {t("strip.card2.title")}
            </div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              {t("strip.card2.body")}
            </p>
          </div>
          <div>
            <div className="text-base font-bold text-white mb-2">
              {t("strip.card3.title")}
            </div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              {t("strip.card3.body")}
            </p>
          </div>
        </div>
      </div>

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
        id="join-healthspan"
      >
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <WaitlistForm
            title={t.rich("form.title", {
              em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
            })}
            subtitle={t("form.subtitle")}
            ageOptions={ageOptions}
            concerns={concerns}
            showWinning
            formId="healthspan"
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
