import { getTranslations } from "next-intl/server";

interface TrackingCol {
  title: string;
  items: string[];
}

export default async function TrackingMetrics() {
  const t = await getTranslations("healthspan.tracking");
  const cols = t.raw("cols") as TrackingCol[];
  return (
    <section className="bg-dr-off border-t border-b border-dr-border py-8 px-10">
      <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-5">
        {t("eyebrow")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cols.map((col, i) => (
          <div key={i}>
            <div
              className={`text-[13px] font-semibold text-dr-ink mb-2 pb-2 border-b-2 ${
                i === 0 ? "border-dr-red" : "border-dr-ink"
              }`}
            >
              {col.title}
            </div>
            <div className="text-[12px] text-dr-mid leading-[1.8]">
              {col.items.map((item, j) => (
                <div key={j}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
