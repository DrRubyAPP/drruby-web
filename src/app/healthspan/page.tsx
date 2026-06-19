import { getTranslations } from "next-intl/server";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Advisors from "@/components/sections/healthspan/Advisors";
import BrennerQuote from "@/components/sections/healthspan/BrennerQuote";
import Definitions from "@/components/sections/healthspan/Definitions";
import EvaluateStack from "@/components/sections/healthspan/EvaluateStack";
import JenniferAnchor from "@/components/sections/healthspan/JenniferAnchor";
import PricingCTA from "@/components/sections/healthspan/PricingCTA";
import TrackingMetrics from "@/components/sections/healthspan/TrackingMetrics";

export default async function HealthspanPage() {
  await getTranslations("healthspan");
  return (
    <>
      <Navbar />
      <BrennerQuote />
      <Definitions />
      <EvaluateStack />
      <Advisors />
      <TrackingMetrics />
      <JenniferAnchor />
      <PricingCTA />
      <Footer />
    </>
  );
}
