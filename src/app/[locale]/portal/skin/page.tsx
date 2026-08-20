import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import AIReport from "@/components/sections/skin/AIReport";
import BrennerIndices from "@/components/sections/skin/BrennerIndices";
import ClinicEntry from "@/components/sections/skin/ClinicEntry";
import EngineeringNotes from "@/components/sections/skin/EngineeringNotes";
import FrequencyGate from "@/components/sections/skin/FrequencyGate";
import ProductRecs from "@/components/sections/skin/ProductRecs";
import ScanWindow from "@/components/sections/skin/ScanWindow";
import TrendChart from "@/components/sections/skin/TrendChart";
import "../../home-v5.css";

export default async function SkinPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell pageTitle={t("nav.skinAnalysis")} pageSub={t("nav.myHealth")}>
      <FrequencyGate />
      <ScanWindow />
      <EngineeringNotes />
      <BrennerIndices />
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 p-4 md:p-5 bg-dr-off">
        <TrendChart />
        <AIReport />
      </div>
      <div className="px-4 md:px-7 pb-5 bg-dr-off">
        <ProductRecs />
      </div>
      <ClinicEntry />
    </PortalShell>
  );
}
