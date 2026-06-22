import { getTranslations } from "next-intl/server";
import PortalShell from "@/components/layout/PortalShell";
import CoachChat from "@/components/sections/portal/CoachChat";
import CoachIntro from "./_intro";

export default async function CoachPage() {
  const t = await getTranslations("portal");
  return (
    <PortalShell
      pageTitle={t("coach.pageTitle")}
      pageSub={t("coach.pageSub")}
    >
      <div className="max-w-[760px]">
        <CoachIntro />
        <CoachChat />
      </div>
    </PortalShell>
  );
}
