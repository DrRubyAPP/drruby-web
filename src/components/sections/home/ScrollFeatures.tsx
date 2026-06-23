import { getTranslations } from "next-intl/server";

interface ScrollItem {
  tag: string;
  name: string;
  desc: string;
}

const IMG_BG = [
  "linear-gradient(135deg,#1A1A1A 0%,#2A1A1A 100%)",
  "linear-gradient(135deg,#F5F0EE 0%,#EDE0D8 100%)",
  "linear-gradient(135deg,#0A1520 0%,#1A2530 100%)",
  "linear-gradient(135deg,#F0EEF5 0%,#E0D8ED 100%)",
  "linear-gradient(135deg,#0A150A 0%,#1A251A 100%)",
];

const IMG_LARGE_TEXT = [
  { text: "Rx", color: "white" },
  { text: "AI", color: "rgba(200,16,46,0.2)" },
  { text: "N=1", color: "white" },
  { text: "Rx", color: "rgba(91,63,160,0.15)" },
  { text: "→", color: "rgba(31,158,90,0.15)" },
];

const IMG_LABELS = [
  { label: "AI Analysis", dark: false },
  { label: "AI Report", dark: true },
  { label: "AI Coach", dark: false },
  { label: "Clinical", dark: true },
  { label: "Recommendations", dark: false },
];

export default async function ScrollFeatures() {
  const t = await getTranslations("home.scroll");
  const items = t.raw("items") as ScrollItem[];
  return (
    <section className="bg-dr-off pt-12 pb-12 md:pt-14 md:pb-14 px-6 md:px-18 overflow-hidden">
      <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-dr-red mb-2">
        {t("label")}
      </div>
      <div className="font-serif text-[28px] md:text-[36px] font-light text-dr-ink mb-8 md:mb-10">
        {t.rich("title", {
          em: (chunks) => <em className="italic">{chunks}</em>,
        })}
      </div>
      <div className="flex gap-0 overflow-x-auto pb-1 border border-dr-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-[0_0_280px] bg-dr-white border-r border-dr-border last:border-r-0"
          >
            <div
              className="h-[180px] flex items-center justify-center relative overflow-hidden"
              style={{ background: IMG_BG[i] }}
            >
              <div
                className="font-serif text-[72px] font-light opacity-10 leading-none select-none"
                style={{ color: IMG_LARGE_TEXT[i].color }}
              >
                {IMG_LARGE_TEXT[i].text}
              </div>
              <div
                className={`absolute bottom-3 left-4 text-[11px] font-semibold tracking-[0.2em] uppercase ${
                  IMG_LABELS[i].dark
                    ? "text-[rgba(0,0,0,0.25)]"
                    : "text-[rgba(255,255,255,0.3)]"
                }`}
              >
                {IMG_LABELS[i].label}
              </div>
            </div>
            <div className="p-[22px] pb-6">
              <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-dr-red mb-[7px]">
                {item.tag}
              </div>
              <div className="font-serif text-[19px] font-normal text-dr-ink mb-[7px] leading-[1.2]">
                {item.name}
              </div>
              <div className="text-[13px] text-dr-mid font-light leading-[1.65]">
                {item.desc}
              </div>
            </div>
          </div>
        ))}
        {/* SkinScope card */}
        <div className="flex-[0_0_300px] bg-dr-white border-r border-dr-border last:border-r-0">
          <div className="h-[180px] bg-dr-wine p-0 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/skinscope.jpg"
              alt="DrRuby SkinScope"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-2.5 right-3 text-[12px] font-bold tracking-[0.14em] bg-dr-red text-white py-[3px] px-2">
              $99
            </div>
            <div className="absolute bottom-3 left-4 text-[11px] font-semibold tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)]">
              SkinScope Hardware
            </div>
          </div>
          <div className="p-[22px] pb-6">
            <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-dr-red mb-[7px]">
              Go Deeper
            </div>
            <div className="font-serif text-[19px] font-normal text-dr-ink mb-[7px] leading-[1.2]">
              SkinScope Attachment
            </div>
            <div className="text-[13px] text-dr-mid font-light leading-[1.65]">
              Unlock dermatoscope-grade precision. Polarized + multi-spectral
              analysis — DermLite quality at 1/20 the price. Clips onto any
              iPhone.
            </div>
            <div className="mt-3 text-[12px] font-semibold tracking-[0.14em] uppercase text-dr-red cursor-pointer">
              Learn More →
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
