import { getTranslations } from "next-intl/server";
import { DownloadModal } from "@/components/DownloadWaitlist";
import Footer from "@/components/layout/Footer";
import HomeNav from "@/components/layout/HomeNav";
import Advisors from "@/components/sections/healthspan/Advisors";
import BrennerQuote from "@/components/sections/healthspan/BrennerQuote";
import Definitions from "@/components/sections/healthspan/Definitions";
import EvaluateStack from "@/components/sections/healthspan/EvaluateStack";
import HealthspanHeader from "@/components/sections/healthspan/HealthspanHeader";
import JenniferAnchor from "@/components/sections/healthspan/JenniferAnchor";
import PricingCTA from "@/components/sections/healthspan/PricingCTA";
import TrackingMetrics from "@/components/sections/healthspan/TrackingMetrics";
import "../home-v5.css";

export default async function HealthspanPage() {
  await getTranslations("healthspan");
  return (
    <>
      {/* Shared homepage header; `display:contents` keeps the sticky nav
          sticking across the page without leaking `.dr-v5` into the body. */}
      <div className="dr-v5" style={{ display: "contents" }}>
        <HomeNav sectionPrefix="/" appControls />
      </div>
      {/* Design `.screen`: padding 32px 48px, gap 32px, body weight 500, on #EDEDEB */}
      <main className="bg-[#EDEDEB] px-4 md:px-12 py-6 md:py-8 flex flex-col gap-6 md:gap-8 font-medium text-dr-ink">
        <HealthspanHeader />
        <BrennerQuote />
        <Definitions />
        <EvaluateStack />
        <Advisors />
        <TrackingMetrics />
        <JenniferAnchor />
        <PricingCTA />
      </main>
      <Footer />
      <DownloadModal />
    </>
  );
}
