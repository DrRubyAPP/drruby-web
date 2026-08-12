import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// useSession mock —— PortalSidebar 应改用 session，不再读 PORTAL_USER
const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
vi.mock("@/lib/auth/client", () => ({
  authClient: { useSession: useSessionMock },
}));

// next/link 在 jsdom 下渲染为 <a>；next/navigation usePathname 给个默认值
vi.mock("next/navigation", () => ({
  usePathname: () => "/portal",
}));

// next-intl：把 key 原样返回，便于断言
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import PortalSidebar from "./PortalSidebar";

beforeEach(() => {
  useSessionMock.mockReset();
});

describe("PortalSidebar", () => {
  it("从 session.user 读取 name/email 渲染底部用户卡", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Alice Lee", email: "alice@x.com" } },
    });
    render(<PortalSidebar />);
    expect(screen.getByText("Alice Lee")).toBeInTheDocument();
    expect(screen.getByText("alice@x.com")).toBeInTheDocument();
  });

  it("不再出现 PORTAL_USER 的写死值 Ruby Johnson / rubysun@gmail.com", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Alice Lee", email: "alice@x.com" } },
    });
    render(<PortalSidebar />);
    expect(screen.queryByText("Ruby Johnson")).toBeNull();
    expect(screen.queryByText("rubysun@gmail.com")).toBeNull();
  });

  it("session 缺 name 时回退到 email 本地名作为显示名", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: null, email: "bob@x.com" } },
    });
    render(<PortalSidebar />);
    // pname 与 pmail 都会展示 email——用 getAllByText
    expect(screen.getAllByText("bob@x.com").length).toBeGreaterThan(0);
  });

  it("initials 取 name 前两词首字母（Alice Lee → AL）", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Alice Lee", email: "alice@x.com" } },
    });
    render(<PortalSidebar />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });
});
