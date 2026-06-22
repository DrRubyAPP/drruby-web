import PortalSidebar from "@/components/layout/PortalSidebar";
import PortalTopbar from "@/components/layout/PortalTopbar";

interface PortalShellProps {
  pageTitle: string;
  pageSub: string;
  primaryAction?: { label: string; href?: string };
  children: React.ReactNode;
}

export default function PortalShell({
  pageTitle,
  pageSub,
  primaryAction,
  children,
}: PortalShellProps) {
  return (
    <div className="flex min-h-screen bg-dr-off">
      <PortalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar
          pageTitle={pageTitle}
          pageSub={pageSub}
          primaryAction={primaryAction}
        />
        <div className="flex-1 p-5 md:p-7 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
