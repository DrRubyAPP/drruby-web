import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：返回 My Decisions 列表 ──
const refetchMock = vi.fn();
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient mock（del 为主测对象）──
const delMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    del: (...args: unknown[]) => delMock(...args),
  },
}));

// ── next-intl mock ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub（push spy 断言未跳转）──
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

import { DecisionsView } from "./DecisionsView";
import type { DecisionDto } from "./dto";

const ACTIVE: DecisionDto = {
  id: "d-active",
  question: "Should I do Thermage?",
  goal: "firmness",
  type: "procedure",
  topic: "Thermage",
  topicSlug: "thermage",
  lifecycle: "ACTIVE",
  decisionKind: "unconfirmed",
  outcome: null,
  nextStep: null,
  saved: false,
  yourselfContext: null,
  updated: "2026-09-01T00:00:00.000Z",
  lastUserActivityAt: "2026-09-01T00:00:00.000Z",
};

beforeEach(() => {
  useApiMock.mockReset();
  delMock.mockReset();
  refetchMock.mockReset();
  pushMock.mockReset();
  useApiMock.mockReturnValue({
    data: [ACTIVE],
    error: null,
    loading: false,
    refetch: refetchMock,
  });
});

describe("DecisionsView · task-50 T7 卡片删除入口", () => {
  it("点卡片删除按钮不触发跳转，打开 ConfirmDialog", () => {
    render(<DecisionsView />);
    const delBtn = screen.getByRole("button", { name: /^delete.ariaLabel$/ });
    fireEvent.click(delBtn);
    // 不跳详情页
    expect(pushMock).not.toHaveBeenCalled();
    // 弹窗打开（title 文案 key 渲染）
    expect(screen.getByText("delete.title")).toBeInTheDocument();
  });

  it("确认后调用 DELETE /api/decisions/[id] 并 refetch", async () => {
    delMock.mockResolvedValueOnce(undefined);
    render(<DecisionsView />);
    fireEvent.click(screen.getByRole("button", { name: /^delete.ariaLabel$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^delete.confirm$/ }));
    await waitFor(() => expect(delMock).toHaveBeenCalledTimes(1));
    expect(delMock).toHaveBeenCalledWith("/api/decisions/d-active");
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
  });

  it("取消后不发请求、关闭弹窗", () => {
    render(<DecisionsView />);
    fireEvent.click(screen.getByRole("button", { name: /^delete.ariaLabel$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^delete.cancel$/ }));
    expect(delMock).not.toHaveBeenCalled();
    expect(screen.queryByText("delete.title")).not.toBeInTheDocument();
  });

  it("Saved & completed 行内删除入口：同 handler 调 DELETE", async () => {
    useApiMock.mockReturnValue({
      data: [
        ACTIVE,
        {
          ...ACTIVE,
          id: "d-closed",
          question: "Closed one",
          lifecycle: "CLOSED",
        },
      ],
      error: null,
      loading: false,
      refetch: refetchMock,
    });
    delMock.mockResolvedValueOnce(undefined);
    render(<DecisionsView />);
    // 第二个删除入口 = Saved & completed 行内（第一个 = Active 卡片）
    const delBtns = screen.getAllByRole("button", {
      name: /^delete.ariaLabel$/,
    });
    expect(delBtns.length).toBe(2);
    fireEvent.click(delBtns[1]);
    fireEvent.click(screen.getByRole("button", { name: /^delete.confirm$/ }));
    await waitFor(() => expect(delMock).toHaveBeenCalledTimes(1));
    expect(delMock).toHaveBeenCalledWith("/api/decisions/d-closed");
  });
});
