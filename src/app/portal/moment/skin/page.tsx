import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import Moment1Flow from "@/components/sections/portal/Moment1Flow";

export default async function MomentSkinPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("moment1.pageTitle")}
      pageSub={t("moment1.pageSub")}
      primaryAction={{
        label: t("topbar.primaryAction"),
        href: "/portal/moment/skin",
      }}
    >
      <Moment1Flow />
    </PortalShell>
  );
}
