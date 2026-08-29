import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：按 path 返回不同值 ──
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
    del: vi.fn(),
  },
}));

// ── next-intl：返回 key 原样 ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub（避免 next-intl/navigation 拉起 next/navigation）──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
});

describe("ConnectToDecisionDialog · C6 显式 Connect（task-42）", () => {
  it("renders available decisions as radio options", () => {
    useApiMock.mockReturnValue({
      data: DECISIONS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectToDecisionDialog recordId="r1" open onClose={() => {}} />);
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
    render(<ConnectToDecisionDialog recordId="r1" open onClose={() => {}} />);
    expect(screen.getByText("connect.empty")).toBeInTheDocument();
  });

  it("Connect button disabled until a decision is selected", () => {
    useApiMock.mockReturnValue({
      data: DECISIONS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectToDecisionDialog recordId="r1" open onClose={() => {}} />);
    const connectBtn = screen.getByRole("button", { name: "connect.confirm" });
    expect(connectBtn).toBeDisabled();
  });

  it("selecting a decision + Connect → POST /api/decisions/[id]/health-records with healthRecordId", async () => {
    useApiMock.mockReturnValue({
      data: DECISIONS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    postMock.mockResolvedValueOnce({});
    const onClose = vi.fn();
    render(<ConnectToDecisionDialog recordId="r1" open onClose={onClose} />);
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
