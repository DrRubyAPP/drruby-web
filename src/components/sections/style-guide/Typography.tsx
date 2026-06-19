import { getTranslations } from "next-intl/server";

interface TypoSample {
  metaLine1: string;
  metaLine2: string;
  text: string;
  variant: "xl" | "lg" | "md" | "sm" | "cap";
}

const VARIANT_CLASS: Record<string, string> = {
  xl: "font-serif text-[44px] font-light text-dr-ink leading-[1.1]",
  lg: "font-serif text-[28px] font-light text-dr-ink",
  md: "font-sans text-[16px] font-normal text-dr-ink",
  sm: "font-sans text-[13px] font-light text-dr-mid leading-[1.7]",
  cap:
    "font-sans text-[12px] font-semibold tracking-[0.18em] uppercase text-dr-ink",
};

export default async function Typography() {
  const t = await getTranslations("styleGuide");
  const samples = t.raw("typoSamples") as TypoSample[];
  return (
    <section className="bg-dr-white border-b border-dr-border py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("typoLabel")}
      </div>
      <div className="flex flex-col gap-6">
        {samples.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-baseline border-b border-dr-border pb-6 last:border-b-0"
          >
            <div className="text-[11px] text-dr-mid leading-[1.6]">
              <div>{s.metaLine1}</div>
              <div>{s.metaLine2}</div>
            </div>
            <div className={VARIANT_CLASS[s.variant]}>{s.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
