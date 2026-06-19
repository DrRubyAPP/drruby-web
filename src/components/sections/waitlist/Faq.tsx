import { getTranslations } from "next-intl/server";

interface FaqItem {
  q: string;
  a: string;
}

export default async function Faq() {
  const t = await getTranslations("waitlist");
  const items = t.raw("faqItems") as FaqItem[];
  return (
    <section className="bg-dr-white py-20 px-6 md:px-12 border-b border-dr-border">
      <div className="max-w-[820px] mx-auto">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-4">
          {t("faqEyebrow")}
        </div>
        <h2 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.1] mb-12">
          {t.rich("faqTitle", {
            em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
          })}
        </h2>
        <div className="flex flex-col">
          {items.map((item, i) => (
            <details
              key={i}
              className="group border-b border-dr-border py-5 last:border-b-0"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-serif text-[18px] font-light text-dr-ink pr-4">
                  {item.q}
                </span>
                <span
                  className="text-dr-mid text-[18px] leading-none transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="text-[12px] text-dr-mid leading-[1.8] mt-4 max-w-[640px]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
