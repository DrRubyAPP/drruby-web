import { getTranslations } from "next-intl/server";
import PortalTopbar from "@/components/layout/PortalTopbar";
import SkinConsiderFlow from "@/components/sections/portal/flows/SkinConsiderFlow";
import "../../portal.css";

export default async function ConsiderSkinPage() {
  const t = await getTranslations("portal");
  return (
    <div id="app-portal" className="flow-page">
      <PortalTopbar
        pageTitle={t("considerSkin.pageTitle")}
        pageSub={t("considerSkin.pageSub")}
        backHref="/portal"
      />
      <div className="flow-body">
        <SkinConsiderFlow />
      </div>
    </div>
  );
}
