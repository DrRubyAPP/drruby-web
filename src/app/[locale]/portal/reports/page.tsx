import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { ReportsList } from "@/components/sections/portal/reports/ReportsList";

export default async function ReportsPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("reports.listPageTitle")}
      pageSub={t("reports.listPageSub")}
    >
      <div className="max-w-[820px]">
        <ReportsList />
      </div>
    </PortalShell>
  );
}
