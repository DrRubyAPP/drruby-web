import { PortalV2 } from "@/components/sections/portal-v2/PortalV2";

const PORTAL_TABS = ["home", "health", "decisions"] as const;

export default async function PortalV2Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = PORTAL_TABS.includes(tab as (typeof PORTAL_TABS)[number])
    ? (tab as (typeof PORTAL_TABS)[number])
    : "home";

  return <PortalV2 initialTab={initialTab} />;
}
