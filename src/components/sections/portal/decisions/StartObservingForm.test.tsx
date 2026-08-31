import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── next-intl mock ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub（与同目录其他组件测试一致） ──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

// ── apiClient.post mock ──
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

import { StartObservingForm } from "./StartObservingForm";

beforeEach(() => {
  postMock.mockReset();
});

describe("StartObservingForm · task-44 §27（sub-plan-3 T8）", () => {
  it("渲染 baseline 文本域 + 频率选择 + 提交按钮", () => {
    render(<StartObservingForm decisionId="d1" />);
    expect(screen.getByText("start.baselineLabel")).toBeInTheDocument();
    expect(screen.getByText("start.freqLabel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^start.submit$/ }),
    ).toBeInTheDocument();
    // 5 个频率选项
    const select = screen.getByRole("combobox");
    expect(select.querySelectorAll("option").length).toBe(5);
    // 缺省 weekly
    expect((select as HTMLSelectElement).value).toBe("weekly");
  });

  it("baseline 为空时提交 → 显示必填错误，不调 API", async () => {
    render(<StartObservingForm decisionId="d1" />);
    fireEvent.click(screen.getByRole("button", { name: /^start.submit$/ }));
    await waitFor(() =>
      expect(
        screen.getByText("start.errorBaselineRequired"),
      ).toBeInTheDocument(),
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("baseline 非空 + 频率=weekly → POST /observe/start", async () => {
    postMock.mockResolvedValueOnce({ id: "d1", lifecycle: "OBSERVING" });
    const onStarted = vi.fn();
    render(<StartObservingForm decisionId="d1" onStarted={onStarted} />);
    const baselineTextarea = screen.getByPlaceholderText(
      "start.baselinePlaceholder",
    );
    fireEvent.change(baselineTextarea, {
      target: { value: "LDL=130" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^start.submit$/ }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/observe/start", {
      baselineText: "LDL=130",
      baselineRecordId: undefined,
      freq: "weekly",
    });
    // 成功后回调 + 清空表单
    await waitFor(() => expect(onStarted).toHaveBeenCalled());
    expect(baselineTextarea).toHaveValue("");
  });

  it("可选填 baselineRecordId 一起提交", async () => {
    postMock.mockResolvedValueOnce({ id: "d1" });
    render(<StartObservingForm decisionId="d1" />);
    const baselineTextarea = screen.getByPlaceholderText(
      "start.baselinePlaceholder",
    );
    const recordInput = screen.getByPlaceholderText(
      "start.baselineRecordPlaceholder",
    );
    fireEvent.change(baselineTextarea, { target: { value: "baseline text" } });
    fireEvent.change(recordInput, { target: { value: "rec-123" } });
    // 改频率到 monthly
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "monthly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^start.submit$/ }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/observe/start", {
      baselineText: "baseline text",
      baselineRecordId: "rec-123",
      freq: "monthly",
    });
  });

  it("提交中按钮禁用（防双提交）", async () => {
    postMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<StartObservingForm decisionId="d1" />);
    fireEvent.change(screen.getByPlaceholderText("start.baselinePlaceholder"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^start.submit$/ }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    // 进入 loading 后按钮显示 submitting 文案且禁用
    const submittingBtn = await screen.findByRole("button", {
      name: /^start.submitting$/,
    });
    expect((submittingBtn as HTMLButtonElement).disabled).toBe(true);
    // 再点一次不会触发新调用
    fireEvent.click(submittingBtn);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("API 失败 → 按钮恢复可点 + 可重试", async () => {
    postMock.mockRejectedValueOnce(new Error("server boom"));
    render(<StartObservingForm decisionId="d1" />);
    fireEvent.change(screen.getByPlaceholderText("start.baselinePlaceholder"), {
      target: { value: "valid baseline" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^start.submit$/ }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    // 失败后按钮恢复 start.submit 文案，可再次点击重试
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^start.submit$/ }),
      ).toBeInTheDocument(),
    );
  });
});
