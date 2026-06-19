import { getTranslations } from "next-intl/server";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SiteStructure from "@/components/sections/architecture/SiteStructure";
import TechLayers from "@/components/sections/architecture/TechLayers";
import UserFlows from "@/components/sections/architecture/UserFlows";

export default async function ArchitecturePage() {
  const t = await getTranslations("architecture");
  return (
    <>
      <Navbar />
      <section className="bg-dr-white py-12 px-8 md:px-14 border-b border-dr-border">
        <div className="font-serif text-[36px] font-light text-dr-ink leading-[1.2]">
          {t.rich("siteTitle", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </div>
        <div className="text-[12px] text-dr-mid mt-1.5">{t("siteSub")}</div>
      </section>
      <SiteStructure />
      <TechLayers />
      <UserFlows />
      <Footer />
    </>
  );
}
