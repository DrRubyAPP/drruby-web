import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import MomentFeelContent from "./_content";

export default async function MomentFeelPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("moment3.pageTitle")}
      pageSub={t("moment3.pageSub")}
    >
      <MomentFeelContent />
    </PortalShell>
  );
}
