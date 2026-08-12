import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

// ── useApi mock：按 path 返回不同值 ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.post mock（Ask DrRuby）──
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

// ── i18n navigation mock ──
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
    style,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: pushMock }),
}));

// ── next-intl：返回 key 原样（便于断言），支持 {name} 等插值回填 ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, string>) => {
    if (!vars) return key;
    let out = key;
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(`{${k}}`, v);
    }
    return out;
  },
}));

// ── 子组件 stub：避免拉起整棵树 ──
vi.mock("@/components/layout/PortalShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}));
vi.mock("@/components/sections/portal/decisions/ActiveDecisionsSummary", () => ({
  ActiveDecisionsSummary: () => <div data-testid="ads" />,
}));
vi.mock("@/components/sections/portal/decisions/DecisionsView", () => ({
  DecisionsView: () => <div data-testid="decisions" />,
}));
vi.mock("@/components/sections/portal/health/HealthView", () => ({
  HealthView: () => <div data-testid="health" />,
}));
vi.mock("@/components/sections/portal/privacy/PrivacyView", () => ({
  PrivacyView: () => <div data-testid="privacy" />,
}));
vi.mock("@/components/sections/portal/research/ResearchView", () => ({
  ResearchView: () => <div data-testid="research" />,
}));
vi.mock("@/components/sections/portal/today/TodayView", () => ({
  TodayView: () => <div data-testid="today" />,
}));
vi.mock("@/components/sections/portal/settings/ExportDataButton", () => ({
  ExportDataButton: () => <button type="button">Export all my data</button>,
}));
vi.mock("@/components/sections/portal/settings/DeleteAccountDialog", () => ({
  DeleteAccountDialog: () => <button type="button">Delete my account</button>,
}));
vi.mock("@/components/auth/LogoutButton", () => ({
  default: () => <button type="button">Log out</button>,
}));

import PortalPage from "./page";

const ME = {
  id: "u1",
  name: "Alice Lee",
  email: "alice@x.com",
  memberSince: "2026-01-01T00:00:00.000Z",
  role: "user",
  subscriptionTier: "free",
};

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  pushMock.mockReset();
  // 默认：/api/me 成功，/api/timeline 空
  useApiMock.mockImplementation((path: string | null) => {
    if (path === "/api/me") {
      return { data: ME, error: null, loading: false, refetch: vi.fn() };
    }
    if (path === "/api/timeline") {
      return { data: [], error: null, loading: false, refetch: vi.fn() };
    }
    return { data: null, error: null, loading: false, refetch: vi.fn() };
  });
});

describe("PortalPage /portal 仪表盘", () => {
  it("Ask DrRuby：输入 + 点击 → POST /api/ask 携带正确 body", async () => {
    postMock.mockResolvedValueOnce({
      choices: [{ message: { role: "assistant", content: "answer" } }],
    });
    render(<PortalPage />);

    const input = screen.getByPlaceholderText("dashboard.ask.placeholder");
    fireEvent.change(input, { target: { value: "test question" } });
    const askBtn = screen.getByRole("button", { name: "dashboard.ask.button" });
    fireEvent.click(askBtn);

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/ask", {
      messages: [{ role: "user", content: "test question" }],
    });
  });

  it("Timeline 空态：渲染 dashboard.timeline.empty", () => {
    render(<PortalPage />);
    expect(screen.getByText("dashboard.timeline.empty")).toBeInTheDocument();
  });

  it("Timeline 错误态：渲染 ErrorState（含 dashboard.timeline.error）", () => {
    useApiMock.mockImplementation((path: string | null) => {
      if (path === "/api/me") {
        return { data: ME, error: null, loading: false, refetch: vi.fn() };
      }
      if (path === "/api/timeline") {
        return {
          data: null,
          error: new ApiError("internal_error", 500, "boom"),
          loading: false,
          refetch: vi.fn(),
        };
      }
      return { data: null, error: null, loading: false, refetch: vi.fn() };
    });
    render(<PortalPage />);
    expect(screen.getByText("dashboard.timeline.error")).toBeInTheDocument();
  });

  it("Profile sub-row：Your profile / Account security 链接正确；Manage billing 不在 DOM", () => {
    render(<PortalPage />);
    // 切到 Profile 视图
    const profileTab = screen.getByText("dashboard.tabs.privacy");
    fireEvent.click(profileTab);

    const profileLink = screen.getByText("Your profile").closest("a");
    expect(profileLink?.getAttribute("href")).toBe("/portal/profile");

    const securityLink = screen.getByText("Account security").closest("a");
    expect(securityLink?.getAttribute("href")).toBe("/portal/settings");

    // Manage billing 已删除（task-24 任务5）
    expect(screen.queryByText("Manage billing")).toBeNull();

    // Download my data / Delete account 复用组件已渲染
    expect(screen.getByText("Export all my data")).toBeInTheDocument();
    expect(screen.getByText("Delete my account")).toBeInTheDocument();
  });

  it("问候语使用 /api/me 的 name + 时辰 key", () => {
    render(<PortalPage />);
    // 时辰 key 形如 dashboard.greeting.{morning|afternoon|evening}
    const hour = new Date().getHours();
    const tod = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
    expect(screen.getByText(`dashboard.greeting.${tod}`)).toBeInTheDocument();
  });
});
