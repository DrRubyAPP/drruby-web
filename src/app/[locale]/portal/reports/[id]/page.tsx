import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import { ReportDetail } from "@/components/sections/portal/reports/ReportDetail";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("portal");

  return (
    <PortalShell
      pageTitle={t("reports.detailPageTitle")}
      pageSub={t("reports.detailPageSub2")}
    >
      <div className="max-w-[760px]">
        <ReportDetail id={id} />
      </div>
    </PortalShell>
  );
}
