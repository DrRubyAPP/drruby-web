import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import Advisors from "@/components/sections/healthspan/Advisors";
import BrennerQuote from "@/components/sections/healthspan/BrennerQuote";
import Definitions from "@/components/sections/healthspan/Definitions";
import EvaluateStack from "@/components/sections/healthspan/EvaluateStack";
import HealthspanHeader from "@/components/sections/healthspan/HealthspanHeader";
import JenniferAnchor from "@/components/sections/healthspan/JenniferAnchor";
import PricingCTA from "@/components/sections/healthspan/PricingCTA";
import TrackingMetrics from "@/components/sections/healthspan/TrackingMetrics";
import "../../home-v5.css";

export default async function HealthspanPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell pageTitle={t("nav.healthspan")} pageSub={t("nav.myHealth")}>
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
    </PortalShell>
  );
}
