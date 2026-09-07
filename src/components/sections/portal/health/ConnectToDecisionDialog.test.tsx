import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：按 path 返回不同值 ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.post/patch mock ──
const postMock = vi.fn();
const patchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    del: vi.fn(),
  },
}));

// ── next-intl：返回 key 原样 ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub（捕获 router.push）──
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

import { ConnectToDecisionDialog } from "./ConnectToDecisionDialog";

interface DecisionListItem {
  id: string;
  question: string;
  lifecycle: string;
}

const DECISIONS: DecisionListItem[] = [
  { id: "d1", question: "Start hormone therapy?", lifecycle: "ACTIVE" },
  { id: "d2", question: "Try spironolactone?", lifecycle: "ACTIVE" },
];

const API_STATE = {
  data: DECISIONS,
  error: null,
  loading: false,
  refetch: vi.fn(),
};

beforeEach(() => {
  useApiMock.mockReset();
  useApiMock.mockReturnValue(API_STATE);
  postMock.mockReset();
  patchMock.mockReset();
  pushMock.mockReset();
});

describe("ConnectToDecisionDialog · C6 显式 Connect（task-42）", () => {
  it("renders available decisions as radio options", () => {
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Start hormone therapy?")).toBeInTheDocument();
    expect(screen.getByText("Try spironolactone?")).toBeInTheDocument();
  });

  it("shows empty hint when no decisions exist", () => {
    useApiMock.mockReturnValue({
      data: [],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("connect.empty")).toBeInTheDocument();
  });

  it("Connect button disabled until a decision is selected", () => {
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    const connectBtn = screen.getByRole("button", { name: "connect.confirm" });
    expect(connectBtn).toBeDisabled();
  });

  it("selecting a decision + Connect → POST /api/decisions/[id]/health-records with healthRecordId", async () => {
    postMock.mockResolvedValueOnce({});
    const onClose = vi.fn();
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={onClose}
      />,
    );
    // 选择第一个 decision（radio）
    fireEvent.click(screen.getByText("Start hormone therapy?"));
    fireEvent.click(screen.getByRole("button", { name: "connect.confirm" }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/health-records", {
      healthRecordId: "r1",
    });
    expect(onClose).toHaveBeenCalled();
  });
});

// =============================================================================
// task-49 T3 · F1 三选一（连接已有 / 新建 / 暂不处理）
// =============================================================================

describe("ConnectToDecisionDialog · 三选一（task-49 F1）", () => {
  it("渲染三个顶层选项（existing / new / dismiss）", () => {
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByRole("radio", { name: /Start hormone therapy\?/ }),
    ).toBeInTheDocument(); // existing 分支内的目标列表
    expect(screen.getByText("connect.newDecision")).toBeInTheDocument();
    expect(screen.getByText("connect.notNow")).toBeInTheDocument();
  });

  it("选「暂不处理」提交 → PATCH dismissConnect 被调；不产生任何 Decision/连接（D-1）", async () => {
    patchMock.mockResolvedValueOnce({});
    const onDismissed = vi.fn();
    const onClose = vi.fn();
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={onClose}
        onDismissed={onDismissed}
      />,
    );
    fireEvent.click(screen.getByText("connect.notNow"));
    fireEvent.click(screen.getByRole("button", { name: "connect.confirm" }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith("/api/health/records/r1", {
      action: "dismissConnect",
    });
    // 不创建 Decision、不连接
    expect(postMock).not.toHaveBeenCalled();
    expect(onDismissed).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("选「新建」+ 填问题 → POST /api/decisions → 自动 connect → 跳详情（P-1）", async () => {
    postMock
      .mockResolvedValueOnce({ id: "dnew" }) // create decision
      .mockResolvedValueOnce({}); // connect
    const onConnected = vi.fn();
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
        onConnected={onConnected}
      />,
    );
    fireEvent.click(screen.getByText("connect.newDecision"));
    fireEvent.change(screen.getByLabelText(/connect.questionLabel/), {
      target: { value: "What do my latest labs mean?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "connect.confirm" }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(2));
    // 1) 创建 Decision
    expect(postMock).toHaveBeenNthCalledWith(1, "/api/decisions", {
      question: "What do my latest labs mean?",
      type: "not_sure",
    });
    // 2) 自动 connect 该 Record
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      "/api/decisions/dnew/health-records",
      { healthRecordId: "r1" },
    );
    // 3) 跳详情页
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/portal/decisions/dnew"),
    );
  });

  it("选「新建」但问题为空 → Confirm disabled", () => {
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("connect.newDecision"));
    expect(
      screen.getByRole("button", { name: "connect.confirm" }),
    ).toBeDisabled();
  });

  it("无 actionable Decision 时三选一仍完整（existing 区空态，new/dismiss 可选）", async () => {
    useApiMock.mockReturnValue({
      data: [],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    patchMock.mockResolvedValueOnce({});
    render(
      <ConnectToDecisionDialog
        recordId="r1"
        recordTitle="CBC panel"
        open
        onClose={() => {}}
      />,
    );
    // existing 区空态文案
    expect(screen.getByText("connect.empty")).toBeInTheDocument();
    // dismiss 分支可用
    fireEvent.click(screen.getByText("connect.notNow"));
    fireEvent.click(screen.getByRole("button", { name: "connect.confirm" }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
  });
});
