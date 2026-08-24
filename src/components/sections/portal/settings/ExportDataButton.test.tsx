import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const getMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: vi.fn(),
  },
}));

import { ExportDataButton } from "./ExportDataButton";

let clickSpy: ReturnType<typeof vi.spyOn>;
let createUrlSpy: ReturnType<typeof vi.fn>;
let revokeUrlSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getMock.mockReset();
  createUrlSpy = vi.fn(() => "blob:mock-url");
  revokeUrlSpy = vi.fn();
  // jsdom 无 blob URL 能力，stub 之
  (URL as unknown as { createObjectURL: unknown }).createObjectURL =
    createUrlSpy;
  (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL =
    revokeUrlSpy;
  clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
});

describe("ExportDataButton", () => {
  it("点击 → GET /api/me/export → 触发 blob 下载，文件名匹配", async () => {
    getMock.mockResolvedValueOnce({ account: { id: "u1" } });
    render(<ExportDataButton />);
    fireEvent.click(screen.getByRole("button", { name: /Download my data/i }));

    expect(getMock).toHaveBeenCalledWith("/api/me/export");
    await waitFor(() => expect(createUrlSpy).toHaveBeenCalledTimes(1));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeUrlSpy).toHaveBeenCalledTimes(1);

    // 校验下载文件名
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^drruby-export-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("network_error → 展示统一网络异常文案，不泄漏后端 message", async () => {
    getMock.mockRejectedValueOnce(new ApiError("network_error", 0, "boom"));
    render(<ExportDataButton />);
    fireEvent.click(screen.getByRole("button", { name: /Download my data/i }));
    await waitFor(() =>
      expect(screen.getByText("网络异常，请检查后重试")).toBeInTheDocument(),
    );
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("401 → 不展示错误文案（交上层处理）", async () => {
    getMock.mockRejectedValueOnce(new ApiError("unauthorized", 401, "no"));
    render(<ExportDataButton />);
    fireEvent.click(screen.getByRole("button", { name: /Download my data/i }));
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/网络异常/)).toBeNull();
    expect(screen.queryByText(/发生未知错误/)).toBeNull();
  });
});
