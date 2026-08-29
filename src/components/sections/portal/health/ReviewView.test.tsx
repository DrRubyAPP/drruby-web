import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HealthRecordDto } from "./dto";

// ── useApi mock：按 path 返回不同值 ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.patch / post mock ──
const patchMock = vi.fn();
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

// ── next-intl：返回 key 原样 ──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub：@/components/api 索引会传递性加载 UnauthorizedRedirect
//    进而触发 next-intl/navigation（jsdom 下 next/navigation 不可用）──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

import { ReviewView } from "./ReviewView";

const RECORD: HealthRecordDto = {
  id: "r1",
  sourceId: "s1",
  kind: "lab",
  title: "June Lab Panel",
  status: "EXTRACTED_DRAFT",
  confidence: "High",
  documentClass: "Lab",
  parsedValues: {
    items: [
      { name: "LDL", value: "168", unit: "mg/dL", flag: "high" },
      { name: "HDL", value: "55", unit: "mg/dL" },
    ],
  },
  pleaseConfirm: [],
  recordedAt: "2026-06-12T10:00:00.000Z",
  source: {
    id: "s1",
    fileName: "june-lab.pdf",
    objectKey: "/files/june-lab.pdf",
    uploadedAt: "2026-06-12T10:00:00.000Z",
  },
  revisions: [],
};

beforeEach(() => {
  useApiMock.mockReset();
  patchMock.mockReset();
  postMock.mockReset();
});

function renderReview(record: HealthRecordDto | null = RECORD) {
  useApiMock.mockReturnValue({
    data: record,
    error: null,
    loading: false,
    refetch: vi.fn(),
  });
  return render(<ReviewView recordId="r1" />);
}

describe("ReviewView · C2/C3/C4（task-42）", () => {
  it("shows each extracted item with name + value + unit (C2)", () => {
    renderReview();
    expect(screen.getByText("LDL")).toBeInTheDocument();
    expect(screen.getByText(/168/)).toBeInTheDocument();
    expect(screen.getByText("HDL")).toBeInTheDocument();
    expect(screen.getByText(/55/)).toBeInTheDocument();
  });

  it("renders C3 'From your report' link to original (placeholder objectKey)", () => {
    renderReview();
    const link = screen.getByText(/review\.fromReport/);
    expect(link.closest("a")).toHaveAttribute("href", "/files/june-lab.pdf");
  });

  it("does NOT show Please confirm when pleaseConfirm is empty", () => {
    renderReview();
    expect(screen.queryByText("pleaseConfirm")).toBeNull();
  });

  it("shows Please confirm flag when record has pleaseConfirm entries (§13)", () => {
    renderReview({
      ...RECORD,
      pleaseConfirm: ["mock_field_unverified"],
      confidence: "Low",
    });
    // 多条 item 时每个 RecordItem 都会渲染 please-confirm 标记
    const flags = screen.getAllByText("pleaseConfirm");
    expect(flags.length).toBeGreaterThan(0);
  });

  it("Confirm action → PATCH /api/health/records/[id] action=advance status=CONFIRMED (C4)", async () => {
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: RECORD,
      error: null,
      loading: false,
      refetch,
    });
    render(<ReviewView recordId="r1" />);
    fireEvent.click(screen.getByText("review.confirm"));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith("/api/health/records/r1", {
      action: "advance",
      status: "CONFIRMED",
    });
  });

  it("Mark for review action → PATCH advance to USER_REVIEW (C4)", async () => {
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: RECORD,
      error: null,
      loading: false,
      refetch,
    });
    render(<ReviewView recordId="r1" />);
    fireEvent.click(screen.getByText("review.markForReview"));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith("/api/health/records/r1", {
      action: "advance",
      status: "USER_REVIEW",
    });
  });

  it("Retry action → POST /api/health/records/[id] (retry endpoint)", async () => {
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: { ...RECORD, status: "PROCESSING" },
      error: null,
      loading: false,
      refetch,
    });
    render(<ReviewView recordId="r1" />);
    fireEvent.click(screen.getByText("review.retry"));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/health/records/r1");
  });

  it("hides Confirm/MarkForReview/Retry once CONFIRMED (avoids duplicate state-machine writes)", () => {
    renderReview({ ...RECORD, status: "CONFIRMED" });
    expect(screen.queryByText("review.confirm")).toBeNull();
    expect(screen.queryByText("review.markForReview")).toBeNull();
    expect(screen.queryByText("review.retry")).toBeNull();
    // 已确认提示
    expect(screen.getByText("review.confirmed")).toBeInTheDocument();
  });
});
