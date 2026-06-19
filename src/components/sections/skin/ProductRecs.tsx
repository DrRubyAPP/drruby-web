import { getTranslations } from "next-intl/server";
import { PRODUCT_RECS } from "@/config/skin-mock";

export default async function ProductRecs() {
  const t = await getTranslations("skin.products");
  return (
    <div className="bg-dr-white border border-dr-border p-5">
      <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
        <span className="block w-2.5 h-px bg-dr-red" />
        {t("title")}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {PRODUCT_RECS.map((p, i) => (
          <div
            key={i}
            className={`flex flex-col items-start p-3.5 border ${
              p.isUpgrade
                ? "border-[rgba(200,16,46,0.15)] bg-[rgba(200,16,46,0.02)]"
                : "border-dr-border"
            }`}
          >
            <div className="text-[18px] mb-2">{p.icon}</div>
            <div className="text-[14px] font-medium text-dr-ink">{p.name}</div>
            <div className="text-[12px] text-dr-mid my-1">{p.reason}</div>
            <div className="text-[13px] font-bold text-dr-red">
              {p.match !== null ? `Match ${p.match}` : p.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
