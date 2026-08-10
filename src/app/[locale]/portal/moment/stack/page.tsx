import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import Moment2Flow from "@/components/sections/portal/moment/Moment2Flow";

export default async function MomentStackPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("moment2.pageTitle")}
      pageSub={t("moment2.pageSub")}
      primaryAction={{
        label: t("topbar.primaryAction"),
        href: "/portal/moment/skin",
      }}
    >
      <Moment2Flow />
    </PortalShell>
  );
}
