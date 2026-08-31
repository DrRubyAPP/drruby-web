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

// ── useApi mock：按 path 返回不同 fixture ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
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

import { LearningSummaryForm } from "./LearningSummaryForm";

const TEMPLATE_TEXT =
  "You recorded 2 observations. This may be worth continuing to observe.";
const OBS_ID_1 = "obs-1";
const OBS_ID_2 = "obs-2";

function setEndpoints(
  opts: {
    templateLoading?: boolean;
    templateError?: { message: string } | null;
    templateText?: string;
    templateIds?: string[];
    obsLoading?: boolean;
    obsError?: { message: string } | null;
    observations?: Array<{
      id: string;
      text: string;
      direction?: string | null;
    }>;
  } = {},
) {
  useApiMock.mockImplementation((path: string | null) => {
    if (path == null) {
      return { data: null, error: null, loading: false, refetch: vi.fn() };
    }
    if (path.endsWith("/learn")) {
      if (opts.templateLoading)
        return { data: null, error: null, loading: true, refetch: vi.fn() };
      if (opts.templateError)
        return {
          data: null,
          error: opts.templateError,
          loading: false,
          refetch: vi.fn(),
        };
      return {
        data: {
          template: {
            text: opts.templateText ?? TEMPLATE_TEXT,
            supportingObservationIds: opts.templateIds ?? [OBS_ID_1, OBS_ID_2],
          },
        },
        error: null,
        loading: false,
        refetch: vi.fn(),
      };
    }
    if (path.endsWith("/observations")) {
      if (opts.obsLoading)
        return { data: null, error: null, loading: true, refetch: vi.fn() };
      if (opts.obsError)
        return {
          data: null,
          error: opts.obsError,
          loading: false,
          refetch: vi.fn(),
        };
      return {
        data: {
          observations: opts.observations ?? [
            { id: OBS_ID_1, text: "first obs", direction: "better" },
            { id: OBS_ID_2, text: "second obs", direction: "worse" },
          ],
        },
        error: null,
        loading: false,
        refetch: vi.fn(),
      };
    }
    return { data: null, error: null, loading: false, refetch: vi.fn() };
  });
}

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  setEndpoints();
});

describe("LearningSummaryForm · task-44 §29（sub-plan-3 T10）", () => {
  it("mount 时 GET /learn 拿模板预填 text + GET /observations 拿详情", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const paths = useApiMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain("/api/decisions/d1/learn");
    expect(paths).toContain("/api/decisions/d1/observations");
    // 模板预填 text 出现在 textarea
    expect(screen.getByText(TEMPLATE_TEXT)).toBeInTheDocument();
  });

  it("模板预填 text 不含禁用标签 Emerging/Moderate/Strong/confidence%", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).not.toMatch(
      /Emerging|Moderate|Strong|confidence\s*%/i,
    );
  });

  it("supporting observations 默认全选（template.supportingObservationIds）", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    for (const cb of checkboxes)
      expect((cb as HTMLInputElement).checked).toBe(true);
  });

  it("可取消个别 supporting observation（D12）", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
  });

  it("text 可编辑（用户补充修改）", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "my edited summary" } });
    expect(textarea.value).toBe("my edited summary");
  });

  it("text 为空时提交 → 显示必填错误，不调 API", async () => {
    render(<LearningSummaryForm decisionId="d1" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(
      screen.getByRole("button", { name: /^learn.saveAndComplete$/ }),
    );
    await waitFor(() =>
      expect(screen.getByText("learn.errorTextRequired")).toBeInTheDocument(),
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("保存 → POST /learn with text + supportingObservationIds（默认全选）", async () => {
    postMock.mockResolvedValueOnce({ learning: { id: "l1" } });
    render(<LearningSummaryForm decisionId="d1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /^learn.saveAndComplete$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/learn", {
      text: TEMPLATE_TEXT,
      supportingObservationIds: [OBS_ID_1, OBS_ID_2],
    });
  });

  it("取消一个 observation 后保存 → POST 不含该 id", async () => {
    postMock.mockResolvedValueOnce({ learning: { id: "l1" } });
    render(<LearningSummaryForm decisionId="d1" />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // 取消第一个
    fireEvent.click(
      screen.getByRole("button", { name: /^learn.saveAndComplete$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/learn", {
      text: TEMPLATE_TEXT,
      supportingObservationIds: [OBS_ID_2], // 只剩第二个
    });
  });

  it("无 observations → supporting 区显示空状态文案", () => {
    setEndpoints({
      templateIds: [],
      observations: [],
    });
    render(<LearningSummaryForm decisionId="d1" />);
    expect(screen.getByText("learn.supportingEmpty")).toBeInTheDocument();
  });

  it("template loading → 骨架屏", () => {
    setEndpoints({ templateLoading: true });
    const { container } = render(<LearningSummaryForm decisionId="d1" />);
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
  });

  it("template error → ErrorState + Retry", () => {
    setEndpoints({ templateError: { message: "template fetch failed" } });
    render(<LearningSummaryForm decisionId="d1" />);
    expect(screen.getByText("template fetch failed")).toBeInTheDocument();
  });

  it("保存中按钮禁用（防双提交）", async () => {
    postMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LearningSummaryForm decisionId="d1" />);
    fireEvent.click(
      screen.getByRole("button", { name: /^learn.saveAndComplete$/ }),
    );
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    const submittingBtn = await screen.findByRole("button", {
      name: /^learn.submitting$/,
    });
    expect((submittingBtn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(submittingBtn);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("direction badge 在 supporting observation 项中显示", () => {
    render(<LearningSummaryForm decisionId="d1" />);
    // 两个 observation 都有 direction（better / worse），应渲染对应 badge 文本
    expect(
      screen.getByText("observation.direction.better"),
    ).toBeInTheDocument();
    expect(screen.getByText("observation.direction.worse")).toBeInTheDocument();
  });
});
