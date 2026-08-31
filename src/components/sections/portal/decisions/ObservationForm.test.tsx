import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── next-intl mock ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub ──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

// ── apiClient mock ──
const postMock = vi.fn();
const patchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

import { ObservationForm } from "./ObservationForm";

beforeEach(() => {
  postMock.mockReset();
  patchMock.mockReset();
});

describe("ObservationForm · task-44 §28（sub-plan-3 T9）", () => {
  it("渲染 4 个 direction 按钮 + 文本域 + 提交按钮（新建模式）", () => {
    render(<ObservationForm decisionId="d1" />);
    expect(screen.getByText("observation.directionLabel")).toBeInTheDocument();
    expect(screen.getByText("observation.textLabel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^observation.submit$/ }),
    ).toBeInTheDocument();
    // 4 个 direction 按钮（better/same/worse/not_sure）
    expect(
      screen.getByRole("button", { name: "observation.direction.better" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "observation.direction.same" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "observation.direction.worse" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "observation.direction.not_sure" }),
    ).toBeInTheDocument();
  });

  it("direction 非必填 — 不选 direction 也能提交（§28 允许无方向描述）", async () => {
    postMock.mockResolvedValueOnce({ id: "e1" });
    render(<ObservationForm decisionId="d1" />);
    fireEvent.change(
      screen.getByPlaceholderText("observation.textPlaceholder"),
      {
        target: { value: "just a description" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^observation.submit$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/observations", {
      text: "just a description",
      direction: undefined,
    });
  });

  it("direction 可取消（再点已选 direction → null）", () => {
    render(<ObservationForm decisionId="d1" />);
    const betterBtn = screen.getByRole("button", {
      name: "observation.direction.better",
    });
    fireEvent.click(betterBtn);
    expect(betterBtn).toHaveAttribute("aria-pressed", "true");
    // 再点一次 → 取消
    fireEvent.click(betterBtn);
    expect(betterBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("选 direction=better + 文本 → POST 带 direction", async () => {
    postMock.mockResolvedValueOnce({ id: "e1" });
    render(<ObservationForm decisionId="d1" />);
    fireEvent.click(
      screen.getByRole("button", { name: "observation.direction.better" }),
    );
    fireEvent.change(
      screen.getByPlaceholderText("observation.textPlaceholder"),
      {
        target: { value: "feeling better" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^observation.submit$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/observations", {
      text: "feeling better",
      direction: "better",
    });
  });

  it("text 为空时提交 → 显示必填错误，不调 API", async () => {
    render(<ObservationForm decisionId="d1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /^observation.submit$/ }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("observation.errorTextRequired"),
      ).toBeInTheDocument(),
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("修正模式预填 existing text + direction（D8）", () => {
    render(
      <ObservationForm
        decisionId="d1"
        existingEntry={{
          id: "e1",
          text: "existing note",
          direction: "worse",
        }}
      />,
    );
    // 预填文本
    expect(
      screen.getByPlaceholderText("observation.textPlaceholder"),
    ).toHaveValue("existing note");
    // 预填 direction=worse（aria-pressed=true）
    expect(
      screen.getByRole("button", { name: "observation.direction.worse" }),
    ).toHaveAttribute("aria-pressed", "true");
    // 提交按钮文案切到 save
    expect(
      screen.getByRole("button", { name: /^observation.save$/ }),
    ).toBeInTheDocument();
  });

  it("修正模式提交 → PATCH /observations/[entryId]（D8 append-only 保留 occurredAt/createdAt）", async () => {
    patchMock.mockResolvedValueOnce({ id: "e1" });
    render(
      <ObservationForm
        decisionId="d1"
        existingEntry={{
          id: "e1",
          text: "old text",
          direction: null,
        }}
      />,
    );
    // 改文本 + 选 direction=better
    fireEvent.change(
      screen.getByPlaceholderText("observation.textPlaceholder"),
      {
        target: { value: "updated note" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "observation.direction.better" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^observation.save$/ }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith(
      "/api/decisions/d1/observations/e1",
      expect.objectContaining({
        text: "updated note",
        direction: "better",
        synthesis: undefined,
      }),
    );
  });

  it("修正模式可显式清空 direction（选 worse 再点 worse → null，PATCH 传 direction=null）", async () => {
    patchMock.mockResolvedValueOnce({ id: "e1" });
    render(
      <ObservationForm
        decisionId="d1"
        existingEntry={{
          id: "e1",
          text: "existing",
          direction: "worse",
        }}
      />,
    );
    const worseBtn = screen.getByRole("button", {
      name: "observation.direction.worse",
    });
    // worse 已预选 → 点一下取消
    fireEvent.click(worseBtn);
    expect(worseBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: /^observation.save$/ }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith(
      "/api/decisions/d1/observations/e1",
      expect.objectContaining({ direction: null }),
    );
  });

  it("提交中按钮禁用（防双提交）", async () => {
    postMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ObservationForm decisionId="d1" />);
    fireEvent.change(
      screen.getByPlaceholderText("observation.textPlaceholder"),
      {
        target: { value: "x" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^observation.submit$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    const submittingBtn = await screen.findByRole("button", {
      name: /^observation.submitting$/,
    });
    expect((submittingBtn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(submittingBtn);
    expect(postMock).toHaveBeenCalledTimes(1);
  });
});
