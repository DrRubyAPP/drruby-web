import { getTranslations } from "next-intl/server";
import PortalTopbar from "@/components/layout/PortalTopbar";
import { DecisionDetailView } from "@/components/sections/portal/decisions/DecisionDetailView";
import "../../portal.css";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("portal");
  const { id } = await params;
  return (
    <div id="app-portal" className="flow-page">
      <PortalTopbar
        pageTitle={t("decisionsDetail.pageTitle")}
        pageSub=""
        backHref="/portal"
      />
      <div className="flow-body">
        <DecisionDetailView id={id} />
      </div>
    </div>
  );
}
