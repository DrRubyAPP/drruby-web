import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function FinalCta() {
  const t = await getTranslations("waitlist");
  return (
    <section className="relative bg-dr-wine overflow-hidden py-24 px-6 md:px-12">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 30% 60%, #3D0A20 0%, #2A0815 50%, #2A050B 100%)",
        }}
      />
      {/* Decorative circles */}
      <div className="absolute left-0 top-0 w-[50%] h-full overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 480,
            height: 480,
            left: -100,
            top: -60,
            border: "1px solid rgba(200,16,46,0.1)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            left: 60,
            top: 100,
            border: "1px solid rgba(200,16,46,0.05)",
          }}
        />
      </div>

      <div className="relative z-3 max-w-[680px]">
        <div className="text-[12px] font-semibold tracking-[0.32em] uppercase text-[rgba(200,16,46,0.65)] mb-[18px]">
          {t("finalCtaEyebrow")}
        </div>
        <h2 className="font-serif text-[40px] md:text-[52px] font-light text-white leading-[1.1] mb-5">
          {t.rich("finalCtaTitle", {
            em: (chunks) => (
              <em className="italic text-[#F0C0C8]">{chunks}</em>
            ),
          })}
        </h2>
        <p className="text-[15px] font-light text-white/55 leading-[1.9] max-w-[480px] mb-9">
          {t("finalCtaSub")}
        </p>
        <Link
          href="#join"
          className="inline-block text-[13px] font-semibold tracking-[0.18em] uppercase bg-dr-red text-white px-9 py-4 no-underline hover:opacity-90 transition-opacity"
        >
          {t("heroCtaPrimary")}
        </Link>
      </div>
    </section>
  );
}
