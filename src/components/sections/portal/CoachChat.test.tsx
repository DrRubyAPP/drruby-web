import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

// mock apiClient.post —— CoachChat 通过 apiClient.post 调 /api/ask
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

// spy notifyUnauthorized 以断言 401 路径
const notifySpy = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, notifyUnauthorized: () => notifySpy() };
});

import CoachChat from "./CoachChat";

function resp(content: string) {
  return { choices: [{ message: { role: "assistant" as const, content } }] };
}

beforeEach(() => {
  postMock.mockReset();
  notifySpy.mockReset();
});

describe("CoachChat", () => {
  it("发送成功：追加 user 消息 → typing → 替换为 assistant content", async () => {
    postMock.mockResolvedValueOnce(resp("hi from ai"));
    render(<CoachChat />);
    const input = screen.getByPlaceholderText(/Ask a question/i);
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));

    // user 消息立即出现
    expect(screen.getByText("hello")).toBeInTheDocument();
    // typing 占位出现
    await waitFor(() => {
      expect(screen.getByText(/DrRuby 正在思考/i)).toBeInTheDocument();
    });
    // LLM 返回后替换为 content
    await waitFor(() => {
      expect(screen.getByText("hi from ai")).toBeInTheDocument();
    });
    expect(screen.queryByText(/DrRuby 正在思考/i)).toBeNull();
  });

  it("503：typing 替换为错误气泡，文案不泄漏后端 message", async () => {
    postMock.mockRejectedValueOnce(
      new ApiError("LLM_UNCONFIGURED", 503, "AI 服务未配置"),
    );
    render(<CoachChat />);
    fireEvent.change(screen.getByPlaceholderText(/Ask a question/i), {
      target: { value: "q" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => {
      expect(
        screen.getByText("DrRuby 暂时无法响应，请稍后再试"),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("AI 服务未配置")).toBeNull();
  });

  it("429：错误气泡文案为限流提示", async () => {
    postMock.mockRejectedValueOnce(
      new ApiError("RATE_LIMITED", 429, "请求过于频繁"),
    );
    render(<CoachChat />);
    fireEvent.change(screen.getByPlaceholderText(/Ask a question/i), {
      target: { value: "q" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => {
      expect(screen.getByText("请求过于频繁，请稍后再试")).toBeInTheDocument();
    });
  });

  it("401：调用 notifyUnauthorized，不渲染错误气泡", async () => {
    postMock.mockRejectedValueOnce(new ApiError("unauthorized", 401, "no"));
    render(<CoachChat />);
    fireEvent.change(screen.getByPlaceholderText(/Ask a question/i), {
      target: { value: "q" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => expect(notifySpy).toHaveBeenCalledTimes(1));
    // 不应出现错误气泡文案
    expect(screen.queryByText(/暂时无法响应/i)).toBeNull();
  });

  it("重试：点击重试重新调用 apiClient.post，成功后替换错误气泡", async () => {
    postMock.mockRejectedValueOnce(new ApiError("LLM_UPSTREAM", 502, "x"));
    postMock.mockResolvedValueOnce(resp("retry ok"));
    render(<CoachChat />);
    fireEvent.change(screen.getByPlaceholderText(/Ask a question/i), {
      target: { value: "first" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => {
      expect(
        screen.getByText("DrRuby 暂时无法响应，请稍后再试"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /重试/i }));
    await waitFor(() => {
      expect(screen.getByText("retry ok")).toBeInTheDocument();
    });
    expect(postMock).toHaveBeenCalledTimes(2);
  });

  it("历史映射：第二次发送时 apiClient.post 收到完整 user+assistant 历史", async () => {
    postMock.mockResolvedValueOnce(resp("ans1"));
    postMock.mockResolvedValueOnce(resp("ans2"));
    render(<CoachChat />);
    const input = screen.getByPlaceholderText(/Ask a question/i);

    fireEvent.change(input, { target: { value: "q1" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => expect(screen.getByText("ans1")).toBeInTheDocument());

    fireEvent.change(input, { target: { value: "q2" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => expect(screen.getByText("ans2")).toBeInTheDocument());

    const secondCallBody = postMock.mock.calls[1][1];
    expect(secondCallBody.messages).toEqual([
      { role: "user", content: "q1" },
      { role: "assistant", content: "ans1" },
      { role: "user", content: "q2" },
    ]);
  });
});
