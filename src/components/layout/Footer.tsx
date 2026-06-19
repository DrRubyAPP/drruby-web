import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");
  return (
    <>
      {/* Footer CTA */}
      <section className="bg-dr-ink py-20 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
        <div>
          <div className="text-[8px] font-semibold tracking-[0.28em] uppercase text-dr-red/50 mb-4">
            {t("ctaEyebrow")}
          </div>
          <h2 className="font-serif text-[40px] font-light leading-[1.15] text-dr-white">
            {t.rich("ctaTitle", {
              em: (chunks) => <em className="italic text-[#F0C0C8]">{chunks}</em>,
              br: () => <br />,
            })}
          </h2>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <Link
            href="/waitlist"
            className="text-[11px] font-semibold tracking-[0.18em] uppercase bg-dr-red text-white px-9 py-4 no-underline hover:opacity-90 transition-opacity"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/waitlist"
            className="text-[10px] font-normal tracking-[0.1em] text-dr-white/30 no-underline hover:text-dr-white/60 transition-colors"
          >
            {t("ctaGhost")}
          </Link>
          <p className="text-[9px] text-dr-white/15 text-right leading-relaxed mt-2">
            {t.rich("ctaFine", { br: () => <br /> })}
          </p>
        </div>
      </section>

      {/* Footer bar */}
      <div className="bg-[#111] py-5 px-6 md:px-12 flex items-center justify-between">
        <div className="font-serif text-[16px] text-dr-white/30">
          Dr<span className="text-dr-red/40">Ruby</span>.ai
        </div>
        <div className="flex gap-6">
          <Link
            href="/legal/privacy"
            className="text-[9px] text-dr-white/18 tracking-[0.08em] no-underline hover:text-dr-white/40 transition-colors"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/architecture"
            className="text-[9px] text-dr-white/18 tracking-[0.08em] no-underline hover:text-dr-white/40 transition-colors"
          >
            {t("science")}
          </Link>
          <Link
            href="/style-guide"
            className="text-[9px] text-dr-white/18 tracking-[0.08em] no-underline hover:text-dr-white/40 transition-colors"
          >
            {t("styleGuide")}
          </Link>
          <span className="text-[9px] text-dr-white/18 tracking-[0.08em]">
            {t("copyright")}
          </span>
        </div>
      </div>
    </>
  );
}
