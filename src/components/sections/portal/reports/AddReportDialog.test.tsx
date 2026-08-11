import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

// useTranslations → 回显 key，断言可直接匹配 key 文案
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// mock apiClient.post —— 断言 POST /api/health/reports
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

import { AddReportDialog } from "./AddReportDialog";

const onCreated = vi.fn();

beforeEach(() => {
  postMock.mockReset();
  onCreated.mockReset();
});

function openDialog() {
  render(<AddReportDialog onCreated={onCreated} />);
  fireEvent.click(screen.getByRole("button", { name: "addCta" }));
}

describe("AddReportDialog", () => {
  it("点触发按钮 → 弹窗打开", () => {
    openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("标题为空 → 提交拦截，显示 titleRequired，不发请求", () => {
    openDialog();
    // 只填日期，标题留空
    fireEvent.change(screen.getByLabelText("form.recordedAt"), {
      target: { value: "2026-06-08" },
    });
    fireEvent.click(screen.getByRole("button", { name: "form.submit" }));
    expect(screen.getByText("form.titleRequired")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("日期为空 → 提交拦截，显示 dateRequired，不发请求", () => {
    openDialog();
    fireEvent.change(screen.getByLabelText("form.titleField"), {
      target: { value: "Blood panel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "form.submit" }));
    expect(screen.getByText("form.dateRequired")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("填 kind/title/date → 提交 → POST 正确路径+body(ISO)，onCreated 调用，弹窗关闭", async () => {
    postMock.mockResolvedValueOnce({
      id: "r1",
      kind: "imaging",
      title: "Chest X-ray",
      ocrStatus: "manual",
      recordedAt: "2026-06-08T00:00:00.000Z",
    });
    openDialog();
    fireEvent.change(screen.getByLabelText("form.kind"), {
      target: { value: "imaging" },
    });
    fireEvent.change(screen.getByLabelText("form.titleField"), {
      target: { value: "Chest X-ray" },
    });
    fireEvent.change(screen.getByLabelText("form.recordedAt"), {
      target: { value: "2026-06-08" },
    });
    fireEvent.click(screen.getByRole("button", { name: "form.submit" }));

    expect(postMock).toHaveBeenCalledWith(
      "/api/health/reports",
      expect.objectContaining({
        kind: "imaging",
        title: "Chest X-ray",
        recordedAt: expect.stringContaining("2026-06-08"),
      }),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    // 关闭：dialog 消失
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("POST 失败（ApiError）→ 显示受信错误文案，弹窗不关闭", async () => {
    postMock.mockRejectedValueOnce(new ApiError("network_error", 0, "boom"));
    openDialog();
    fireEvent.change(screen.getByLabelText("form.titleField"), {
      target: { value: "Lab" },
    });
    fireEvent.change(screen.getByLabelText("form.recordedAt"), {
      target: { value: "2026-06-08" },
    });
    fireEvent.click(screen.getByRole("button", { name: "form.submit" }));

    await waitFor(() =>
      expect(screen.getByText("网络异常，请检查后重试")).toBeInTheDocument(),
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("boom")).toBeNull();
  });
});
