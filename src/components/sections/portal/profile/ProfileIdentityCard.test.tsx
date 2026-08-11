import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { MeDto } from "./dto";

// mock useApi —— 控制读态（data/loading/error/refetch）
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// mock apiClient.post —— 断言 POST /api/me 保存
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

import { ProfileIdentityCard } from "./ProfileIdentityCard";

const ME: MeDto = {
  id: "u1",
  name: "Ada",
  email: "a@x.com",
  memberSince: "2026-01-01T00:00:00.000Z",
  role: "user",
  subscriptionTier: "free",
};

const refetch = vi.fn();

function mockRead(over: Partial<ReturnType<typeof useApiMock>> = {}) {
  useApiMock.mockReturnValue({
    data: ME,
    error: null,
    loading: false,
    refetch,
    ...over,
  });
}

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  refetch.mockReset();
});

describe("ProfileIdentityCard", () => {
  it("读取渲染真实 name/email", () => {
    mockRead();
    render(<ProfileIdentityCard />);
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("a@x.com")).toBeInTheDocument();
  });

  it("Edit → 改名 → Save 调用 POST /api/me 并展示新名、退出编辑态", async () => {
    mockRead();
    postMock.mockResolvedValueOnce({ ...ME, name: "Bob" });
    render(<ProfileIdentityCard />);

    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    const input = screen.getByDisplayValue("Ada");
    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(postMock).toHaveBeenCalledWith("/api/me", { name: "Bob" });
    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());
    // 退出编辑态：不再有输入框
    expect(screen.queryByDisplayValue("Bob")).toBeNull();
  });

  it("空 name（trim 后为空）拦截，不发请求", () => {
    mockRead();
    render(<ProfileIdentityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    fireEvent.change(screen.getByDisplayValue("Ada"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));
    expect(postMock).not.toHaveBeenCalled();
  });

  it("保存失败（非 401）→ 编辑态内展示统一错误文案", async () => {
    mockRead();
    postMock.mockRejectedValueOnce(new ApiError("network_error", 0, "boom"));
    render(<ProfileIdentityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    fireEvent.change(screen.getByDisplayValue("Ada"), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));
    await waitFor(() =>
      expect(screen.getByText("网络异常，请检查后重试")).toBeInTheDocument(),
    );
    // 不泄漏后端 message
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("Cancel 退出编辑态，不发请求", () => {
    mockRead();
    render(<ProfileIdentityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    fireEvent.change(screen.getByDisplayValue("Ada"), {
      target: { value: "Zed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(postMock).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("Zed")).toBeNull();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("useApi 返回 error 且无 data → ErrorState + 重试调 refetch", () => {
    mockRead({
      data: null,
      error: new ApiError("unknown", 500, "读失败"),
    });
    render(<ProfileIdentityCard />);
    fireEvent.click(screen.getByRole("button", { name: /重试/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
