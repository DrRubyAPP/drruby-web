import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import StackConsiderFlow from "@/components/sections/portal/flows/StackConsiderFlow";

export default async function ConsiderStackPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("considerStack.pageTitle")}
      pageSub={t("considerStack.pageSub")}
      primaryAction={{
        label: t("topbar.primaryAction"),
        href: "/portal/consider/skin",
      }}
    >
      <StackConsiderFlow />
    </PortalShell>
  );
}
