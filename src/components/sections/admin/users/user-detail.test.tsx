import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { AdminUserDTO } from "./dto";

// next-intl → 直出 key
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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

const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

const patchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: { patch: (...args: unknown[]) => patchMock(...args) },
}));

// onUnauthorized 内部用 window.location；stub 防止 jsdom 报错
vi.mock("@/lib/api/unauthorized", () => ({
  notifyUnauthorized: vi.fn(),
  onUnauthorized: () => () => {},
}));

import UserDetailIsland from "./user-detail";

const refetch = vi.fn();

const DTO: AdminUserDTO = {
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
  refetch.mockReset();
  patchMock.mockReset();
});

describe("UserDetailIsland", () => {
  it("loading 且无 data → 骨架文案", () => {
    mockRead({ loading: true });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("error 且无 data → ErrorState（loadError 文案）", () => {
    mockRead({ error: new ApiError("unknown", 500, "读失败") });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(
      screen.getByText("users.detail.errors.notFound"),
    ).toBeInTheDocument();
  });

  it("data 命中 → 渲染 email 标题 + 只读字段 + 返回链接 + 编辑表单", () => {
    mockRead({ data: DTO });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    // 标题
    expect(screen.getByText("alice@x.com")).toBeInTheDocument();
    // 只读字段标签
    expect(
      screen.getByText("users.detail.readonly.authProvider"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("users.detail.readonly.emailVerified"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("users.detail.readonly.subscriptionTier"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("users.detail.readonly.timezone"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("users.detail.readonly.updatedAt"),
    ).toBeInTheDocument();
    // 只读字段值
    expect(screen.getByText("credential")).toBeInTheDocument();
    expect(screen.getByText("free")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
    // 返回链接
    const back = screen.getByText(/users\.detail\.back/);
    expect(back.closest("a")).toHaveAttribute("href", "/admin/users");
    // 编辑表单
    expect(screen.getByText("users.detail.form.title")).toBeInTheDocument();
    expect(screen.getByLabelText("users.detail.form.name")).toHaveValue(
      "Alice",
    );
  });

  it("emailVerified=true → 渲染 ✓", () => {
    mockRead({ data: DTO });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("emailVerified=false → 渲染 ✗", () => {
    mockRead({ data: { ...DTO, emailVerified: false } });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByText("✗")).toBeInTheDocument();
  });

  it("isSelf=true → role/status 字段禁用 + 顶部 loadSelfForbidden 提示 + submit 禁用", () => {
    mockRead({ data: DTO });
    render(<UserDetailIsland id="u1" currentUserId="u1" />);
    expect(
      screen.getByText("users.detail.errors.loadSelfForbidden"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("users.detail.form.role")).toBeDisabled();
    expect(screen.getByLabelText("users.detail.form.status")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "users.detail.form.submit" }),
    ).toBeDisabled();
  });

  it("isSelf=false → 无 loadSelfForbidden 提示 + submit 可用", () => {
    mockRead({ data: DTO });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(
      screen.queryByText("users.detail.errors.loadSelfForbidden"),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "users.detail.form.submit" }),
    ).not.toBeDisabled();
  });

  it("提交表单 → apiClient.patch 用正确 body 调用 + 成功后 refetch", async () => {
    mockRead({ data: DTO });
    patchMock.mockResolvedValueOnce({ ...DTO, name: "Alice2" });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);

    const nameInput = screen.getByLabelText("users.detail.form.name");
    fireEvent.change(nameInput, { target: { value: "Alice2" } });
    fireEvent.click(
      screen.getByRole("button", { name: "users.detail.form.submit" }),
    );

    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith("/api/admin/users/u1", {
      name: "Alice2",
      role: "user",
      status: "active",
    });
    expect(refetch).toHaveBeenCalled();
  });

  it("mutation 成功 → 渲染 success.updated 文案", async () => {
    mockRead({ data: DTO });
    patchMock.mockResolvedValueOnce({ ...DTO });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    fireEvent.click(
      screen.getByRole("button", { name: "users.detail.form.submit" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("users.detail.success.updated"),
      ).toBeInTheDocument(),
    );
  });

  it("mutation 失败 → 渲染 updateFailed 文案", async () => {
    mockRead({ data: DTO });
    patchMock.mockRejectedValueOnce(new ApiError("unknown", 500, "写失败"));
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    fireEvent.click(
      screen.getByRole("button", { name: "users.detail.form.submit" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("users.detail.errors.updateFailed"),
      ).toBeInTheDocument(),
    );
  });

  it("data 为空且无 error → notFound 文案", () => {
    mockRead({ data: null });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(
      screen.getByText("users.detail.errors.notFound"),
    ).toBeInTheDocument();
  });

  it("name 为 null → 表单初始值为空字符串", () => {
    mockRead({ data: { ...DTO, name: null } });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByLabelText("users.detail.form.name")).toHaveValue("");
  });

  it("status=suspended → 表单初始 status=suspended", () => {
    mockRead({ data: { ...DTO, status: "suspended" } });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByLabelText("users.detail.form.status")).toHaveValue(
      "suspended",
    );
  });

  it("status=deleted → 表单回退为 suspended（deleted 不在选项中）", () => {
    mockRead({ data: { ...DTO, status: "deleted" } });
    render(<UserDetailIsland id="u1" currentUserId="admin1" />);
    expect(screen.getByLabelText("users.detail.form.status")).toHaveValue(
      "suspended",
    );
  });
});
