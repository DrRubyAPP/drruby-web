import { getTranslations } from "next-intl/server";

interface Step {
  num: string;
  title: string;
  desc: string;
}

export default async function BrennerScience() {
  const t = await getTranslations("home.science");
  const steps = t.raw("steps") as Step[];
  return (
    <section className="bg-dr-grey border-t border-dr-border">
      <div className="pt-14 px-12 md:px-18 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3.5">
            {t("eyebrow")}
          </div>
          <div className="font-serif text-[34px] font-light text-dr-ink leading-[1.2] mb-4">
            {t.rich("title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </div>
          <div className="text-[12px] font-light text-dr-mid leading-[1.9]">
            {t("desc")}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-dr-white border border-dr-border py-6 px-7 flex gap-5 items-start">
            <div className="w-10 h-10 bg-dr-ink rounded-full flex-shrink-0 flex items-center justify-center font-serif text-base text-white">
              B
            </div>
            <div>
              <div className="text-[12px] font-semibold text-dr-ink mb-0.5">
                {t("advisor1Name")}
              </div>
              <div className="text-[10px] text-dr-mid leading-[1.5] mb-2.5">
                {t("advisor1Role")}
              </div>
              <div className="font-serif text-[13px] italic text-dr-mid leading-[1.7]">
                &ldquo;{t("advisor1Quote")}&rdquo;
              </div>
            </div>
          </div>
          <div className="bg-dr-off border border-dr-border py-6 px-7 flex gap-5 items-start">
            <div className="w-10 h-10 bg-[rgba(200,16,46,0.15)] text-dr-red rounded-full flex-shrink-0 flex items-center justify-center font-serif text-base">
              J
            </div>
            <div>
              <div className="text-[12px] font-semibold text-dr-ink mb-0.5">
                {t("advisor2Name")}
              </div>
              <div className="text-[10px] text-dr-mid leading-[1.5] mb-2.5">
                {t("advisor2Role")}
              </div>
              <div className="font-serif text-[13px] italic text-dr-mid leading-[1.7]">
                &ldquo;{t("advisor2Quote")}&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* How it works: 5-step diagram */}
      <div className="px-12 md:px-18 pb-14 pt-0 flex gap-0 items-stretch">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex-1 p-7 border border-dr-border bg-dr-white relative ${
              i < steps.length - 1 ? "border-r-0" : ""
            }`}
          >
            <div className="font-serif text-[32px] text-[rgba(200,16,46,0.15)] font-light mb-2 leading-none">
              {step.num}
            </div>
            <div className="text-[12px] font-semibold text-dr-ink mb-1.5 tracking-[0.04em]">
              {step.title}
            </div>
            <div className="text-[11px] text-dr-mid leading-[1.65] font-light">
              {step.desc}
            </div>
            {i < steps.length - 1 && (
              <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-dr-white border border-dr-border border-l-0 border-b-0 rotate-45 z-1" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
