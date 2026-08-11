import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const clearTokenMock = vi.fn();
vi.mock("@/lib/auth/token", () => ({
  clearBearerToken: () => clearTokenMock(),
}));

import { DeleteAccountDialog } from "./DeleteAccountDialog";

beforeEach(() => {
  postMock.mockReset();
  pushMock.mockReset();
  clearTokenMock.mockReset();
});

function openDialog() {
  render(<DeleteAccountDialog />);
  fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));
}

describe("DeleteAccountDialog", () => {
  it("点触发按钮 → 弹窗出现，确认按钮初始禁用", () => {
    openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yes, delete/i })).toBeDisabled();
  });

  it("勾选复选框 → 确认启用；确认 → POST /api/me/delete → 清 token 跳 /login", async () => {
    postMock.mockResolvedValueOnce({ deleted: true });
    openDialog();
    fireEvent.click(screen.getByRole("checkbox"));
    const confirm = screen.getByRole("button", { name: /Yes, delete/i });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    expect(postMock).toHaveBeenCalledWith("/api/me/delete");
    await waitFor(() => expect(clearTokenMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("失败（非 401）→ 弹窗内展示统一文案，弹窗不关，可重试", async () => {
    postMock.mockRejectedValueOnce(new ApiError("network_error", 0, "boom"));
    openDialog();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Yes, delete/i }));
    await waitFor(() =>
      expect(screen.getByText("网络异常，请检查后重试")).toBeInTheDocument(),
    );
    // 弹窗仍在
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("取消 → 弹窗关闭、复选框复位、不发请求", () => {
    openDialog();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(postMock).not.toHaveBeenCalled();
    // 重新打开：复选框已复位、确认禁用
    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: /Yes, delete/i })).toBeDisabled();
  });
});
