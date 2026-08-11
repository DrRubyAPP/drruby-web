import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { HealthRecordDto } from "./dto";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    return t;
  },
}));

// next/link → 直出 anchor（保留 href 断言）
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// AddReportDialog 依赖 apiClient；此处 mock 防止真实网络
vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { ReportsList } from "./ReportsList";

const refetch = vi.fn();

const DTO: HealthRecordDto = {
  id: "r1",
  kind: "lab",
  title: "Complete blood count",
  source: "City Lab",
  ocrStatus: "manual",
  recordedAt: "2026-06-08T00:00:00.000Z",
};

function mockRead(over: Record<string, unknown> = {}) {
  useApiMock.mockReturnValue({
    data: null,
    error: null,
    loading: false,
    refetch,
    ...over,
  });
}

beforeEach(() => {
  useApiMock.mockReset();
  refetch.mockReset();
});

describe("ReportsList", () => {
  it("loading 且无 data → 骨架（无卡片链接、无错误）", () => {
    mockRead({ loading: true });
    render(<ReportsList />);
    expect(screen.getByTestId("reports-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("loadError")).toBeNull();
  });

  it("error 且无 data → ErrorState + loadError + 重试触发 refetch", () => {
    mockRead({ error: new ApiError("unknown", 500, "读失败") });
    render(<ReportsList />);
    expect(screen.getByText("loadError")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重试/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("data 为空 → 空态引导 + 新增入口", () => {
    mockRead({ data: [] });
    render(<ReportsList />);
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "addCta" })).toBeInTheDocument();
  });

  it("data 非空 → 渲染 title/kind/status/日期 + 详情链接", () => {
    mockRead({ data: [DTO] });
    render(<ReportsList />);
    expect(screen.getByText("Complete blood count")).toBeInTheDocument();
    expect(screen.getByText("kind.lab")).toBeInTheDocument();
    expect(screen.getByText("status.manual")).toBeInTheDocument();
    expect(screen.getByText("Jun 8, 2026")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/portal/reports/r1");
  });
});
