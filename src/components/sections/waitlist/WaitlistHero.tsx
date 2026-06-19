import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function WaitlistHero() {
  const t = await getTranslations("waitlist");
  return (
    <section className="relative bg-dr-wine overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 70% 50%, #5E0E1C 0%, #3D0810 55%, #2A050B 100%)",
        }}
      />
      {/* Decorative circles */}
      <div className="absolute right-0 top-0 w-[55%] h-full overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            right: -80,
            top: -60,
            border: "1px solid rgba(200,16,46,0.12)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            right: 40,
            top: 80,
            border: "1px solid rgba(200,16,46,0.06)",
          }}
        />
        <div
          className="absolute font-serif italic font-light select-none"
          style={{
            right: 80,
            top: 120,
            fontSize: 220,
            lineHeight: 1,
            color: "rgba(255,255,255,0.025)",
          }}
        >
          N=1
        </div>
      </div>
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(42,5,11,0.88) 0%, rgba(42,5,11,0.5) 45%, transparent 70%)",
        }}
      />

      <div className="relative z-3 px-6 md:px-12 py-24 md:py-32 max-w-[640px]">
        <div className="text-[12px] font-semibold tracking-[0.32em] uppercase text-[rgba(200,16,46,0.65)] mb-[18px]">
          {t("heroEyebrow")}
        </div>
        <h1 className="font-serif text-[44px] md:text-[56px] font-light text-white leading-[1.08] mb-5">
          {t.rich("heroTitle", {
            em: (chunks) => <em className="italic text-[#F0C0C8]">{chunks}</em>,
          })}
        </h1>
        <p className="text-[15px] font-light text-white/55 leading-[1.9] max-w-[440px] mb-9">
          {t("heroSubtitle")}
        </p>
        <div className="flex gap-3 items-center">
          <Link
            href="#join"
            className="text-[13px] font-semibold tracking-[0.18em] uppercase bg-dr-red text-white px-7 py-3 no-underline hover:opacity-90 transition-opacity"
          >
            {t("heroCtaPrimary")}
          </Link>
          <Link
            href="/"
            className="text-[13px] font-normal tracking-[0.1em] text-white/55 border border-white/15 px-6 py-3 no-underline hover:text-white hover:border-white/30 transition-all"
          >
            {t("heroCtaGhost")}
          </Link>
        </div>
      </div>
    </section>
  );
}
