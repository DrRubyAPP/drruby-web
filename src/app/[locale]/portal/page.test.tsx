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
vi.mock(
  "@/components/sections/portal/decisions/ActiveDecisionsSummary",
  () => ({
    ActiveDecisionsSummary: () => <div data-testid="ads" />,
  }),
);
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
  it("侧边栏：6 个卡片式菜单项（含副标），用户区显示 /api/me 数据", () => {
    const { container } = render(<PortalPage />);

    const items = container.querySelectorAll(".nav-item");
    expect(items.length).toBe(6);

    // 主标 + 副标（My Health 等）
    expect(screen.getByText("dashboard.tabs.today.label")).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.today.sub")).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.health.label")).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.health.sub")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.tabs.decisions.sub"),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.library.sub")).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.research.sub")).toBeInTheDocument();
    expect(screen.getByText("dashboard.tabs.privacy.sub")).toBeInTheDocument();

    // 旧深色侧边栏菜单（skin/healthspan）不出现
    expect(screen.queryByText("nav.skinAnalysis")).toBeNull();
    expect(screen.queryByText("nav.healthspan")).toBeNull();

    // 底部用户区：头像 initials + 姓名 + email（/api/me）
    expect(container.querySelector(".avatar")?.textContent).toBe("AL");
    expect(container.querySelector(".pname")?.textContent).toBe("Alice Lee");
    expect(container.querySelector(".pmail")?.textContent).toBe("alice@x.com");
  });

  it("侧边栏：点击菜单切换视图（active 态 + .ufv on）", () => {
    const { container } = render(<PortalPage />);

    expect(container.querySelector("#v-today")?.className).toContain("on");

    fireEvent.click(screen.getByText("dashboard.tabs.health.label"));
    expect(container.querySelector("#v-health")?.className).toContain("on");
    expect(container.querySelector("#v-today")?.className).not.toContain("on");
    expect(container.querySelector("#n-health")?.className).toContain("active");
    expect(container.querySelector("#n-today")?.className).not.toContain(
      "active",
    );
  });

  it("Ask about your health：输入 + 点击 → POST /api/decisions 并跳转详情（缺省 not_sure）", async () => {
    postMock.mockResolvedValueOnce({ id: "d1" });
    render(<PortalPage />);

    const input = screen.getByPlaceholderText("dashboard.ask.placeholder");
    fireEvent.change(input, { target: { value: "test question" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions", {
      question: "test question",
      type: "not_sure",
    });
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/portal/decisions/d1"),
    );
  });

  it("Ask topic chip：选中 Botox 后提交 → { topic, topicSlug, type } 三元组", async () => {
    postMock.mockResolvedValueOnce({ id: "d2" });
    render(<PortalPage />);

    fireEvent.click(screen.getByRole("button", { name: "Botox" }));
    const input = screen.getByPlaceholderText("dashboard.ask.placeholder");
    fireEvent.change(input, { target: { value: "another question" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions", {
      question: "another question",
      topic: "Botox",
      topicSlug: "botox",
      type: "procedure",
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

  it("Profile 视图：导出/删除数据复用组件已渲染；设计稿静态行不挂死链", () => {
    render(<PortalPage />);
    // 切到 Profile 视图
    const profileTab = screen.getByText("dashboard.tabs.privacy.label");
    fireEvent.click(profileTab);

    // Your profile / Account security 按设计稿渲染为静态行，但不是链接
    // （task-34 已删除对应路由，不恢复死链）
    const profileRow = screen.getByText("Your profile").closest("div");
    expect(profileRow?.querySelector("a")).toBeNull();
    const securityRow = screen.getByText("Account security").closest("div");
    expect(securityRow?.querySelector("a")).toBeNull();

    // Manage billing 按设计稿渲染为静态行，但不是链接（无 /portal/billing 死链）
    const billing = screen.getByText("Manage billing").closest("div");
    expect(billing?.querySelector("a")).toBeNull();

    // Download my data / Delete account 复用组件已渲染
    expect(screen.getByText("Export all my data")).toBeInTheDocument();
    expect(screen.getByText("Delete my account")).toBeInTheDocument();
  });

  it("问候语使用 /api/me 的 name + 时辰 key", () => {
    render(<PortalPage />);
    // 时辰 key 形如 dashboard.greeting.{morning|afternoon|evening}
    const hour = new Date().getHours();
    const tod =
      hour >= 5 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 18
          ? "afternoon"
          : "evening";
    expect(screen.getByText(`dashboard.greeting.${tod}`)).toBeInTheDocument();
  });
});
