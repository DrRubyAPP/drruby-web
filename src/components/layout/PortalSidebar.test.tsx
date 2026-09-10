import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PortalSidebar from "./PortalSidebar";

// Mock 依赖
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  usePathname: vi.fn(() => "/portal"),
}));

vi.mock("@/hooks/useApi", () => ({
  useApi: vi.fn(() => ({
    data: { id: "user-123", name: "John Doe", email: "john@example.com" },
  })),
}));

vi.mock("@/components/auth/LogoutButton", () => {
  return {
    default: function MockLogoutButton() {
      return <button>Logout</button>;
    },
  };
});

vi.mock("@/lib/portal/dashboard", () => ({
  getInitials: (name: string) => name.split(" ").map((n: string) => n[0]).join(""),
}));

describe("PortalSidebar", () => {
  it("应该渲染主导航的三项", () => {
    render(<PortalSidebar />);

    const homeLink = screen.getByText("dashboard.tabs.home.label");
    const healthLink = screen.getByText("dashboard.tabs.health.label");
    const decisionsLink = screen.getByText("dashboard.tabs.decisions.label");

    expect(homeLink).toBeInTheDocument();
    expect(healthLink).toBeInTheDocument();
    expect(decisionsLink).toBeInTheDocument();
  });

  it("应该在侧栏底部渲染账户区块并链接到 /portal/settings", () => {
    render(<PortalSidebar />);

    const settingsLink = screen.getByText("John Doe").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/portal/settings");
  });

  it("应该渲染 LogoutButton", () => {
    render(<PortalSidebar />);

    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeInTheDocument();
  });

  it("应该显示用户信息（名字和邮箱）", () => {
    render(<PortalSidebar />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });
});
