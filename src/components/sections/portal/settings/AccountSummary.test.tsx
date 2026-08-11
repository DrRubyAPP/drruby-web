import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { MeDto } from "../profile/dto";

const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

import { AccountSummary } from "./AccountSummary";

const ME: MeDto = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@x.com",
  memberSince: "2026-01-01T00:00:00.000Z",
  role: "user",
  subscriptionTier: "free",
};

const refetch = vi.fn();

beforeEach(() => {
  useApiMock.mockReset();
  refetch.mockReset();
});

describe("AccountSummary", () => {
  it("读取渲染真实 name/email（只读）", () => {
    useApiMock.mockReturnValue({
      data: ME,
      error: null,
      loading: false,
      refetch,
    });
    render(<AccountSummary />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@x.com")).toBeInTheDocument();
    // 只读：无输入框
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("Edit profile 链接指向 /portal/profile", () => {
    useApiMock.mockReturnValue({
      data: ME,
      error: null,
      loading: false,
      refetch,
    });
    render(<AccountSummary />);
    const link = screen.getByRole("link", { name: /Edit profile/i });
    expect(link).toHaveAttribute("href", "/portal/profile");
  });

  it("error 且无 data → ErrorState + 重试调 refetch", () => {
    useApiMock.mockReturnValue({
      data: null,
      error: new ApiError("unknown", 500, "读失败"),
      loading: false,
      refetch,
    });
    render(<AccountSummary />);
    screen.getByRole("button", { name: /重试/i }).click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
