import { getTranslations } from "next-intl/server";

interface Definition {
  eyebrow: string;
  title: string;
  desc: string;
}

export default async function Definitions() {
  const t = await getTranslations("healthspan");
  const items = t.raw("definitions") as Definition[];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-dr-border">
      {items.map((d, i) => (
        <div key={i} className="bg-dr-white p-7">
          <div className="text-[14px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3">
            {d.eyebrow}
          </div>
          <div className="font-serif text-[18px] font-medium text-dr-ink mb-2.5 leading-[1.4]">
            {d.title}
          </div>
          <div className="text-[15px] text-[#111] leading-[1.7]">{d.desc}</div>
        </div>
      ))}
    </div>
  );
}
