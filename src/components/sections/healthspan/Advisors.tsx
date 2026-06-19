import { getTranslations } from "next-intl/server";

interface Advisor {
  initials: string;
  tag: string;
  name: string;
  role: string;
  advises: string;
}

export default async function Advisors() {
  const t = await getTranslations("healthspan.advisors");
  const items = t.raw("items") as Advisor[];
  return (
    <section className="bg-dr-white py-9 px-10">
      <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-1.5">
        {t("eyebrow")}
      </div>
      <div className="font-serif text-[22px] font-light text-dr-ink mb-6">
        {t("title")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((a, i) => (
          <div key={i} className="border border-dr-border p-6">
            <div
              className={`w-12 h-12 mb-3.5 flex items-center justify-center ${
                i === 0
                  ? "bg-dr-ink"
                  : "bg-dr-off border border-dr-border"
              }`}
            >
              <span
                className={`font-serif text-[20px] font-light ${
                  i === 0 ? "text-white" : "text-dr-ink"
                }`}
              >
                {a.initials}
              </span>
            </div>
            <div className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dr-red mb-1">
              {a.tag}
            </div>
            <div className="text-[14px] font-medium text-dr-ink mb-1">
              {a.name}
            </div>
            <div className="text-[12px] text-dr-mid mb-3 leading-[1.5]">
              {a.role}
            </div>
            <div className="text-[12px] text-dr-mid leading-[1.7] border-t border-dr-border pt-3">
              {a.advises}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
