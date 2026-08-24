import { getTranslations } from "next-intl/server";
import PortalTopbar from "@/components/layout/PortalTopbar";
import StackConsiderFlow from "@/components/sections/portal/flows/StackConsiderFlow";
import "../../portal.css";

export default async function ConsiderStackPage() {
  const t = await getTranslations("portal");
  return (
    <div id="app-portal" className="flow-page">
      <PortalTopbar
        pageTitle={t("considerStack.pageTitle")}
        pageSub={t("considerStack.pageSub")}
        backHref="/portal"
      />
      <div className="flow-body">
        <StackConsiderFlow />
      </div>
    </div>
  );
}
