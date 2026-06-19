import { getTranslations } from "next-intl/server";

interface Layer {
  num: string;
  name: string;
  nameSuffix?: string;
  desc: string;
  tag: string;
  moat?: boolean;
}

const TAG_STYLE: Record<string, string> = {
  "Table stakes": "bg-[#E8E8E8] text-[#888]",
  "Input to moat": "bg-[#E3F2FD] text-[#1565C0]",
  "IP · File patent": "bg-[rgba(200,16,46,0.1)] text-dr-red font-bold",
  Differentiator: "bg-[#E8F5E9] text-[#2E7D32]",
  "UI, not product": "bg-[#E8E8E8] text-[#888]",
};

export default async function TechLayers() {
  const t = await getTranslations("architecture");
  const layers = t.raw("layers") as Layer[];
  return (
    <section className="bg-dr-white border-b border-dr-border py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("techLabel")}
      </div>
      <div className="text-[10px] text-dr-mid mb-5">{t("techIntro")}</div>
      <div className="flex flex-col gap-0">
        {layers.map((layer, i) => (
          <div key={i}>
            <div
              className={`p-4 px-5 ${
                layer.moat
                  ? "border-2 border-dr-red bg-[rgba(200,16,46,0.03)]"
                  : "border border-dr-border bg-[#F5F5F5]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-[10px] font-bold tracking-[0.16em] uppercase min-w-[80px] ${
                    layer.moat ? "text-dr-red" : "text-dr-mid"
                  }`}
                >
                  {layer.num}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-dr-ink">
                    {layer.name}{" "}
                    {layer.nameSuffix && (
                      <span className="text-dr-red">{layer.nameSuffix}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-dr-mid mt-[3px] leading-[1.7]">
                    {layer.desc}
                  </div>
                </div>
                <div
                  className={`ml-auto text-[10px] px-2.5 py-[3px] rounded-[20px] whitespace-nowrap ${
                    TAG_STYLE[layer.tag] || "bg-[#E8E8E8] text-[#888]"
                  }`}
                >
                  {layer.tag}
                </div>
              </div>
            </div>
            {i < layers.length - 1 && (
              <div className="text-center text-[14px] text-[rgba(200,16,46,0.3)] py-1">
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 px-4 py-3 bg-[#FFF8E1] border border-[#E8C080] text-[10px] text-[#8B5E20] leading-[1.7]">
        <strong>{t("moatNote")}</strong>
      </div>
    </section>
  );
}
