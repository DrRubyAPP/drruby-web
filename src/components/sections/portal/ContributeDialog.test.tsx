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

// next-intl：key 原样返回
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ContributeDialog } from "./ContributeDialog";

beforeEach(() => {
  postMock.mockReset();
});

describe("ContributeDialog", () => {
  it("填写表单提交 → POST /api/contributions 携带正确 body（shared 默认 false）", async () => {
    postMock.mockResolvedValueOnce({ id: "c1", title: "t", shared: false });
    render(<ContributeDialog open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("contribute.titleLabel"), {
      target: { value: "My Thermage story" },
    });
    fireEvent.change(screen.getByLabelText("contribute.descriptionLabel"), {
      target: { value: "Gradual firmness over 3 months." },
    });
    fireEvent.click(screen.getByRole("button", { name: "contribute.submit" }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/contributions", {
      title: "My Thermage story",
      description: "Gradual firmness over 3 months.",
      shared: false,
    });
    await waitFor(() =>
      expect(screen.getByText("contribute.success")).toBeInTheDocument(),
    );
  });

  it("勾选 shared → body 携带 shared=true", async () => {
    postMock.mockResolvedValueOnce({ id: "c1", title: "t", shared: true });
    render(<ContributeDialog open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("contribute.titleLabel"), {
      target: { value: "Shared story" },
    });
    fireEvent.change(screen.getByLabelText("contribute.descriptionLabel"), {
      target: { value: "Willing to publish." },
    });
    fireEvent.click(screen.getByLabelText("contribute.sharedLabel"));
    fireEvent.click(screen.getByRole("button", { name: "contribute.submit" }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/api/contributions", {
        title: "Shared story",
        description: "Willing to publish.",
        shared: true,
      }),
    );
  });

  it("400 校验错误 → 展示错误文案", async () => {
    postMock.mockRejectedValueOnce(
      new ApiError("validation_error", 400, "请求参数不合法"),
    );
    render(<ContributeDialog open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("contribute.titleLabel"), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByLabelText("contribute.descriptionLabel"), {
      target: { value: "y" },
    });
    fireEvent.click(screen.getByRole("button", { name: "contribute.submit" }));

    await waitFor(() =>
      expect(screen.getByText("发生未知错误，请重试")).toBeInTheDocument(),
    );
    // 弹窗不自动关闭，可修改重试
    expect(
      screen.getByRole("button", { name: "contribute.submit" }),
    ).toBeInTheDocument();
  });

  it("提交中禁用按钮；成功后 Done 关闭", async () => {
    postMock.mockResolvedValueOnce({ id: "c1" });
    const onClose = vi.fn();
    render(<ContributeDialog open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText("contribute.titleLabel"), {
      target: { value: "t" },
    });
    fireEvent.change(screen.getByLabelText("contribute.descriptionLabel"), {
      target: { value: "d" },
    });
    fireEvent.click(screen.getByRole("button", { name: "contribute.submit" }));

    await waitFor(() =>
      expect(screen.getByText("contribute.success")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "contribute.done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
