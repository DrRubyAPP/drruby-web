import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import SkinConsiderFlow from "@/components/sections/portal/flows/SkinConsiderFlow";

export default async function ConsiderSkinPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("considerSkin.pageTitle")}
      pageSub={t("considerSkin.pageSub")}
      primaryAction={{
        label: t("topbar.primaryAction"),
        href: "/portal/consider/skin",
      }}
    >
      <SkinConsiderFlow />
    </PortalShell>
  );
}
