import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { AdminUserDTO, AdminUserListResponse } from "./dto";

// next-intl → 直出 key（便于断言文案键）；带 params 时模拟模板替换。
const I18N_TEMPLATES: Record<string, string> = {
  "users.pagination.page": "Page {current} of {total}",
};
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const tmpl = I18N_TEMPLATES[key] ?? key;
    if (!params) return tmpl;
    return tmpl.replace(/\{(\w+)\}/g, (_m, k: string) =>
      String(params[k] ?? ""),
    );
  },
}));

// next/link → 直出 anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(window.location.search || "?page=1&search="),
  useRouter: () => ({ push: pushMock }),
}));

const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

import UsersListIsland from "./users-list";

const refetch = vi.fn();

const USER_A: AdminUserDTO = {
  id: "u1",
  email: "alice@x.com",
  name: "Alice",
  role: "user",
  status: "active",
  authProvider: "credential",
  emailVerified: true,
  subscriptionTier: "free",
  timezone: "UTC",
  lastLoginAt: "2026-08-10T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-10T00:00:00.000Z",
};

const USER_B: AdminUserDTO = {
  ...USER_A,
  id: "u2",
  email: "bob@x.com",
  name: "Bob",
  role: "clinic",
  status: "suspended",
  lastLoginAt: null,
};

function mockList(over: Partial<AdminUserListResponse> = {}) {
  const data = over.data ?? [USER_A, USER_B];
  const total = over.total ?? data.length;
  const page = over.page ?? 1;
  const pageSize = over.pageSize ?? 20;
  useApiMock.mockReturnValue({
    data: { data, total, page, pageSize },
    error: null,
    loading: false,
    refetch,
  });
}

function mockRead(over: Record<string, unknown> = {}) {
  useApiMock.mockReturnValue({
    data: null,
    error: null,
    loading: false,
    refetch,
    ...over,
  });
}

beforeEach(() => {
  useApiMock.mockReset();
  pushMock.mockReset();
  refetch.mockReset();
  // 重置 URL（jsdom）
  window.history.replaceState({}, "", "/admin/users");
});

describe("UsersListIsland", () => {
  it("loading → 渲染 Loading 文案（无表格）", () => {
    mockRead({ loading: true });
    render(<UsersListIsland />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("error → ErrorState（含 loadError 文案）+ 重试触发 refetch", () => {
    mockRead({ error: new ApiError("unknown", 500, "读失败") });
    render(<UsersListIsland />);
    expect(screen.getByText("users.loadError")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重试/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("data 为空 → empty 文案", () => {
    mockList({ data: [], total: 0 });
    render(<UsersListIsland />);
    expect(screen.getByText("users.empty")).toBeInTheDocument();
  });

  it("data 含 search → noResults 文案", () => {
    window.history.replaceState({}, "", "/admin/users?search=zzz");
    mockList({ data: [], total: 0 });
    render(<UsersListIsland />);
    expect(screen.getByText("users.noResults")).toBeInTheDocument();
  });

  it("data 非空 → 渲染表头与行（6 列）+ 详情链接", () => {
    mockList();
    render(<UsersListIsland />);
    // 表头
    expect(screen.getByText("users.columns.email")).toBeInTheDocument();
    expect(screen.getByText("users.columns.name")).toBeInTheDocument();
    expect(screen.getByText("users.columns.role")).toBeInTheDocument();
    expect(screen.getByText("users.columns.status")).toBeInTheDocument();
    expect(screen.getByText("users.columns.createdAt")).toBeInTheDocument();
    expect(screen.getByText("users.columns.lastLoginAt")).toBeInTheDocument();
    // 行数据
    expect(screen.getByText("alice@x.com")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("users.role.user")).toBeInTheDocument();
    expect(screen.getByText("users.status.active")).toBeInTheDocument();
    expect(screen.getByText("bob@x.com")).toBeInTheDocument();
    expect(screen.getByText("users.role.clinic")).toBeInTheDocument();
    expect(screen.getByText("users.status.suspended")).toBeInTheDocument();
    // 详情链接
    const linkA = screen.getByRole("link", { name: "alice@x.com" });
    expect(linkA).toHaveAttribute("href", "/admin/users/u1");
    // Bob 没有 lastLoginAt → "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("status=deleted → 列展示 '-'（不渲染 deleted 标签）", () => {
    const deletedUser: AdminUserDTO = {
      ...USER_A,
      id: "ud",
      email: "del@x.com",
      name: null,
      status: "deleted",
    };
    mockList({ data: [deletedUser], total: 1 });
    render(<UsersListIsland />);
    expect(screen.getByText("del@x.com")).toBeInTheDocument();
    expect(screen.queryByText("users.status.deleted")).toBeNull();
  });

  it("输入搜索词回车 → router.push 触发（重置 page）", async () => {
    mockList();
    render(<UsersListIsland />);
    const input = screen.getByPlaceholderText("users.searchPlaceholder");
    fireEvent.change(input, { target: { value: "alice" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    const pushed = pushMock.mock.calls[0][0] as string;
    expect(pushed).toContain("/admin/users?");
    expect(pushed).toContain("search=alice");
    // 搜索时重置 page
    expect(pushed).not.toMatch(/page=/);
  });

  it("点击 next 翻页 → router.push 触发（page + 1）", async () => {
    window.history.replaceState({}, "", "/admin/users?page=1");
    mockList({ page: 1, pageSize: 1, total: 2 }); // 2 页
    render(<UsersListIsland />);
    const next = screen.getByRole("button", { name: "users.pagination.next" });
    fireEvent.click(next);
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock.mock.calls[0][0] as string).toContain("page=2");
  });

  it("首页时 prev 禁用", () => {
    window.history.replaceState({}, "", "/admin/users?page=1");
    mockList({ page: 1, pageSize: 1, total: 5 });
    render(<UsersListIsland />);
    const prev = screen.getByRole("button", { name: "users.pagination.prev" });
    expect(prev).toBeDisabled();
  });

  it("末页时 next 禁用", () => {
    window.history.replaceState({}, "", "/admin/users?page=2");
    mockList({ page: 2, pageSize: 1, total: 2 });
    render(<UsersListIsland />);
    const next = screen.getByRole("button", { name: "users.pagination.next" });
    expect(next).toBeDisabled();
  });

  it("pagination.page 文案含 current/total", () => {
    window.history.replaceState({}, "", "/admin/users?page=2");
    mockList({ page: 2, pageSize: 1, total: 3 });
    render(<UsersListIsland />);
    // mock 模板替换后："Page 2 of 3"
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });
});
