import { getTranslations } from "next-intl/server";

interface ValuePoint {
  eyebrow: string;
  title: string;
  desc: string;
}

export default async function ValuePoints() {
  const t = await getTranslations("waitlist");
  const points = t.raw("valuePoints") as ValuePoint[];
  return (
    <section className="bg-dr-white border-b border-dr-border py-20 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
        {points.map((p, i) => (
          <div key={i} className="flex flex-col">
            <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-4">
              {p.eyebrow}
            </div>
            <h3 className="font-serif text-[24px] font-light text-dr-ink leading-[1.2] mb-3">
              {p.title}
            </h3>
            <p className="text-[12px] text-dr-mid leading-[1.8]">{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 pt-8 border-t border-dr-border flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-dr-red" />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-dr-mid">
          {t("privacyNote")}
        </p>
      </div>
    </section>
  );
}
