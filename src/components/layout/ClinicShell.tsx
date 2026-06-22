import ClinicSidebar from "@/components/layout/ClinicSidebar";
import ClinicTopbar from "@/components/layout/ClinicTopbar";

interface ClinicShellProps {
  pageTitle: string;
  pageSub?: string;
  primaryAction?: { label: string; href?: string };
  children: React.ReactNode;
}

// B2B Clinic Portal shell — light sidebar variant (spec §1.3) with the
// patient-data-authorization topbar (spec §0.3, §1.2).
export default function ClinicShell({
  pageTitle,
  pageSub,
  primaryAction,
  children,
}: ClinicShellProps) {
  return (
    <div className="clinic-portal flex min-h-screen bg-dr-off">
      <ClinicSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ClinicTopbar
          pageTitle={pageTitle}
          pageSub={pageSub}
          primaryAction={primaryAction}
        />
        <div className="flex-1 p-5 md:p-7 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
