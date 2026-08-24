import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import FeelObserveContent from "./_content";

export default async function ObserveFeelPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("observeFeel.pageTitle")}
      pageSub={t("observeFeel.pageSub")}
    >
      <FeelObserveContent />
    </PortalShell>
  );
}
