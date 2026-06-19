import { getTranslations } from "next-intl/server";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ColorPalette from "@/components/sections/style-guide/ColorPalette";
import MobilePreview from "@/components/sections/style-guide/MobilePreview";
import Typography from "@/components/sections/style-guide/Typography";

export default async function StyleGuidePage() {
  const t = await getTranslations("styleGuide");
  return (
    <>
      <Navbar />
      <section className="bg-dr-white py-12 px-8 md:px-14 border-b border-dr-border">
        <div className="font-serif text-[36px] font-light text-dr-ink leading-[1.2]">
          {t.rich("title", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </div>
        <div className="text-[12px] text-dr-mid mt-1.5">{t("sub")}</div>
      </section>
      <ColorPalette />
      <Typography />
      <MobilePreview />
      <Footer />
    </>
  );
}
