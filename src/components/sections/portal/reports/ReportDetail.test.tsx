import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { HealthRecordDto } from "./dto";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

import { ReportDetail } from "./ReportDetail";

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

describe("ReportDetail", () => {
  it("loading 且无 data → 骨架", () => {
    mockRead({ loading: true });
    render(<ReportDetail id="r1" />);
    expect(screen.getByTestId("report-detail-skeleton")).toBeInTheDocument();
  });

  it("error 且无 data → ErrorState + loadError", () => {
    mockRead({ error: new ApiError("unknown", 500, "读失败") });
    render(<ReportDetail id="r1" />);
    expect(screen.getByText("loadError")).toBeInTheDocument();
  });

  it("data 命中 id → 渲染 title/kind/status/日期", () => {
    mockRead({ data: [DTO] });
    render(<ReportDetail id="r1" />);
    expect(screen.getByText("Complete blood count")).toBeInTheDocument();
    expect(screen.getByText("kind.lab")).toBeInTheDocument();
    expect(screen.getByText("status.manual")).toBeInTheDocument();
    expect(screen.getByText("Jun 8, 2026")).toBeInTheDocument();
    expect(screen.getByText("backToList")).toBeInTheDocument();
  });

  it("data 不含 id → notFound 文案 + 返回链接（不崩溃）", () => {
    mockRead({ data: [DTO] });
    render(<ReportDetail id="missing" />);
    expect(screen.getByText("notFound")).toBeInTheDocument();
    const back = screen.getByText("backToList");
    expect(back.closest("a")).toHaveAttribute("href", "/portal/reports");
  });
});
