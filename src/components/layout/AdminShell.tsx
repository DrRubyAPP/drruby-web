import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

interface AdminShellProps {
  pageTitle: string;
  pageSub?: string;
  children: React.ReactNode;
}

// Admin Console shell（参考 ClinicShell）：浅色 sidebar + topbar + 内容区。
export default function AdminShell({
  pageTitle,
  pageSub,
  children,
}: AdminShellProps) {
  return (
    <div className="admin-portal flex min-h-screen bg-dr-off">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar pageTitle={pageTitle} pageSub={pageSub} />
        <div className="flex-1 p-5 md:p-7 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
