import { getTranslations } from "next-intl/server";
import PortalTopbar from "@/components/layout/PortalTopbar";
import FeelObserveContent from "./_content";
import "../../portal.css";

export default async function ObserveFeelPage() {
  const t = await getTranslations("portal");
  return (
    <div id="app-portal" className="flow-page">
      <PortalTopbar
        pageTitle={t("observeFeel.pageTitle")}
        pageSub={t("observeFeel.pageSub")}
        backHref="/portal"
      />
      <div className="flow-body">
        <FeelObserveContent />
      </div>
    </div>
  );
}
