import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.del mock ──
const delMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: (...args: unknown[]) => delMock(...args),
  },
}));

// ── next-intl：返回 key 原样 ──
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

import { ConnectedRecordsPanel } from "./ConnectedRecordsPanel";
import type { DecisionHealthRecordDto } from "./dto";

const LINKS: DecisionHealthRecordDto[] = [
  {
    id: "link1",
    decisionId: "d1",
    healthRecordId: "r1",
    connectedBy: "u1",
    connectedAt: "2026-06-13T10:00:00.000Z",
    removedAt: null,
    healthRecord: {
      id: "r1",
      sourceId: "s1",
      kind: "lab",
      title: "June Lab Panel",
      status: "CONFIRMED",
      confidence: "High",
      documentClass: "Lab",
      parsedValues: { items: [{ name: "LDL", value: "168" }] },
      pleaseConfirm: [],
      recordedAt: "2026-06-12T10:00:00.000Z",
    },
  },
  {
    id: "link2",
    decisionId: "d1",
    healthRecordId: "r2",
    connectedBy: "u1",
    connectedAt: "2026-06-14T10:00:00.000Z",
    removedAt: null,
    healthRecord: {
      id: "r2",
      sourceId: "s2",
      kind: "vitals",
      title: "Resting HR log",
      status: "CONFIRMED",
      confidence: "High",
      recordedAt: "2026-06-14T08:00:00.000Z",
    },
  },
];

beforeEach(() => {
  useApiMock.mockReset();
  delMock.mockReset();
});

describe("ConnectedRecordsPanel · C9 软删除留痕（task-42）", () => {
  it("lists active connected records", () => {
    useApiMock.mockReturnValue({
      data: LINKS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectedRecordsPanel decisionId="d1" />);
    expect(screen.getByText("June Lab Panel")).toBeInTheDocument();
    expect(screen.getByText("Resting HR log")).toBeInTheDocument();
  });

  it("shows empty hint when no connections", () => {
    useApiMock.mockReturnValue({
      data: [],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectedRecordsPanel decisionId="d1" />);
    expect(screen.getByText("connected.empty")).toBeInTheDocument();
  });

  it("renders status label via i18n key path (task-42 T9 records.* namespace)", () => {
    useApiMock.mockReturnValue({
      data: LINKS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectedRecordsPanel decisionId="d1" />);
    // LINKS 两条均为 CONFIRMED → tr(statusKey) → "status.CONFIRMED"
    // 状态文本与连接日期同处一个 div（"status.CONFIRMED · 6/13/2026"），用子串匹配
    expect(screen.getAllByText(/status\.CONFIRMED/)).toHaveLength(2);
  });

  it("Remove → DELETE /api/decisions/[id]/health-records?healthRecordId=X (软删除留痕)", async () => {
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: LINKS,
      error: null,
      loading: false,
      refetch,
    });
    delMock.mockResolvedValueOnce(null);
    render(<ConnectedRecordsPanel decisionId="d1" />);
    const removeButtons = screen.getAllByRole("button", {
      name: "connected.remove",
    });
    fireEvent.click(removeButtons[0]);
    await waitFor(() => expect(delMock).toHaveBeenCalledTimes(1));
    expect(delMock).toHaveBeenCalledWith(
      "/api/decisions/d1/health-records?healthRecordId=r1",
    );
    expect(refetch).toHaveBeenCalled();
  });
});

// =============================================================================
// task-49 T5 · D-2 已删记录占位降级
// =============================================================================

describe("ConnectedRecordsPanel · 已删记录占位（task-49 D-2）", () => {
  it("healthRecord.deletedAt 非空 → 占位「记录已删除」，无 Remove 按钮，不可点击", () => {
    useApiMock.mockReturnValue({
      data: [
        {
          ...LINKS[0],
          healthRecord: {
            ...LINKS[0].healthRecord,
            deletedAt: "2026-09-01T00:00:00.000Z",
          },
        },
        LINKS[1],
      ],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ConnectedRecordsPanel decisionId="d1" />);
    // 占位文案
    expect(
      screen.getByText("connected.deletedPlaceholder"),
    ).toBeInTheDocument();
    // 已删行仍显示标题（置灰划线），供追溯
    expect(screen.getByText("June Lab Panel")).toBeInTheDocument();
    // 活跃行有 Remove，已删行没有 → 只有 1 个 Remove 按钮
    expect(
      screen.getAllByRole("button", { name: "connected.remove" }),
    ).toHaveLength(1);
    // 活跃行正常渲染
    expect(screen.getByText("Resting HR log")).toBeInTheDocument();
  });
});
