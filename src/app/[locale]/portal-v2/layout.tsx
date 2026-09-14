import type { ReactNode } from "react";
import { UnauthorizedRedirect } from "@/components/api";
import { redirect } from "@/i18n/navigation";
import { homeHrefForRole } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/session";
import "../portal/portal.css";
import "./portal-v2.css";

/** Parallel AI-first portal. It intentionally shares the portal's role guard
 * and visual language, while leaving the classic workflow untouched. */
export default async function PortalV2Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect({ href: "/login", locale });
  const role = session?.user ? (session.user as { role?: string }).role : null;
  if (role !== "user" && role !== "admin") {
    redirect({ href: homeHrefForRole(role), locale });
  }
  return <><UnauthorizedRedirect />{children}</>;
}
