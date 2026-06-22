import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import PortalHome from "@/components/sections/portal/PortalHome";

export default async function PortalPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("home.pageTitle")}
      pageSub={t("home.pageSub")}
      primaryAction={{
        label: t("topbar.primaryAction"),
        href: "/portal/moment/skin",
      }}
    >
      <PortalHome />
    </PortalShell>
  );
}
