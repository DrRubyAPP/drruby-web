import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// useApi mock：按 path 返回可变状态
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// 详情按需 fetch 的 apiClient mock
const getMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: vi.fn(),
  },
}));

// next-intl：key 原样返回
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { LibraryJourneys } from "./LibraryJourneys";

const JOURNEYS = [
  {
    id: "j1",
    decisionType: "thermage",
    goal: "firmer skin",
    concern: "sagging jawline",
    timingContext: "postpartum",
    summary: "Subtle firmness over 2-3 months.",
    outcome: "would_do_again",
    sourceType: "verified_member",
    version: 1,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "j2",
    decisionType: "hrt",
    goal: "sleep quality",
    concern: null,
    timingContext: null,
    summary: "Sleep improved after HRT.",
    outcome: null,
    sourceType: "founder_interview",
    version: 1,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  useApiMock.mockReset();
  getMock.mockReset();
  useApiMock.mockReturnValue({
    data: null,
    error: null,
    loading: false,
    refetch: vi.fn(),
  });
});

describe("LibraryJourneys", () => {
  it("渲染 journey 卡片：标题 + summary + sourceType 标签", () => {
    useApiMock.mockReturnValue({
      data: JOURNEYS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<LibraryJourneys />);

    expect(screen.getByText("Thermage")).toBeInTheDocument();
    expect(
      screen.getByText("Subtle firmness over 2-3 months."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sleep improved after HRT.")).toBeInTheDocument();
    // sourceType 走 i18n key（测试环境返回 key 原样，meta 行含日期等拼接）
    expect(screen.getByText(/sourceType\.verified_member/)).toBeInTheDocument();
    expect(
      screen.getByText(/sourceType\.founder_interview/),
    ).toBeInTheDocument();
  });

  it("空态：渲染空态文案", () => {
    useApiMock.mockReturnValue({
      data: [],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<LibraryJourneys />);
    expect(screen.getByText("journeys.empty")).toBeInTheDocument();
  });

  it("点击卡片 → GET /api/journeys/[id] 展开详情（含 updates），再点收起", async () => {
    useApiMock.mockReturnValue({
      data: JOURNEYS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    getMock.mockResolvedValueOnce({
      ...JOURNEYS[0],
      updates: [
        {
          id: "u1",
          version: 1,
          note: "Month 3: fine lines look softer.",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    render(<LibraryJourneys />);

    fireEvent.click(screen.getByText("Thermage"));
    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith("/api/journeys/j1"),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Month 3: fine lines look softer."),
      ).toBeInTheDocument(),
    );
    // 详情标签（i18n key 原样，标签带冒号渲染）
    expect(screen.getByText(/journeys\.detailGoal/)).toBeInTheDocument();

    // 再点收起
    fireEvent.click(screen.getByText("Thermage"));
    expect(screen.queryByText("Month 3: fine lines look softer.")).toBeNull();
  });

  it("详情加载失败 → 展示错误文案但不崩", async () => {
    useApiMock.mockReturnValue({
      data: JOURNEYS,
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    getMock.mockRejectedValueOnce(new Error("boom"));
    render(<LibraryJourneys />);

    fireEvent.click(screen.getByText("Thermage"));
    await waitFor(() =>
      expect(screen.getByText("journeys.error")).toBeInTheDocument(),
    );
  });
});
