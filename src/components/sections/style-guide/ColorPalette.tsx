import { getTranslations } from "next-intl/server";

interface PaletteColor {
  name: string;
  hex: string;
}

export default async function ColorPalette() {
  const t = await getTranslations("styleGuide");
  const palette = t.raw("palette") as PaletteColor[];
  return (
    <section className="bg-dr-white border-b border-dr-border py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("paletteLabel")}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {palette.map((c) => (
          <div key={c.hex}>
            <div
              className="h-20 mb-2"
              style={{
                background: c.hex,
                border: c.hex === "#FFFFFF" ? "1px solid #E8E5E2" : "none",
              }}
            />
            <div className="text-[12px] font-medium text-dr-ink">{c.name}</div>
            <div className="text-[10px] text-dr-mid">{c.hex}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
