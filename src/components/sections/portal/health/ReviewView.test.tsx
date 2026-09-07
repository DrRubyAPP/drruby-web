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
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
  pushMock.mockReset();
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

  it("shows per-field Please confirm badge when item name is in pleaseConfirm（§13，来自 DB 非 FS 猜测）", () => {
    // task-48 F3：徽标按字段名匹配（LDL 在 pleaseConfirm → 只有 LDL 行带标记）
    renderReview({
      ...RECORD,
      pleaseConfirm: ["LDL"],
      confidence: "Low",
    });
    const flags = screen.getAllByText("pleaseConfirm");
    expect(flags).toHaveLength(1); // 仅 LDL 一行
    expect(flags[0].closest(".rec-item")?.textContent).toContain("LDL");
  });

  it("does NOT show per-field badge for items not listed in pleaseConfirm", () => {
    renderReview({
      ...RECORD,
      pleaseConfirm: ["HDL"],
    });
    // LDL 行无徽标，HDL 行有一条
    const flags = screen.getAllByText("pleaseConfirm");
    expect(flags).toHaveLength(1);
    expect(flags[0].closest(".rec-item")?.textContent).toContain("HDL");
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

  it("Retry action（FAILED 态）→ POST /api/health/records/[id] trigger 端点", async () => {
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: {
        ...RECORD,
        status: "FAILED",
        error: "PDF 暂不支持自动抽取，请手动录入",
      },
      error: null,
      loading: false,
      refetch,
    });
    render(<ReviewView recordId="r1" />);
    // 失败文案来自 DTO（DB extractionError）
    expect(
      screen.getByText("PDF 暂不支持自动抽取，请手动录入"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("review.retry"));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/health/records/r1");
  });

  it("PROCESSING 态不显示动作按钮（轮询等终态，点击会 409）", () => {
    renderReview({ ...RECORD, status: "PROCESSING" });
    expect(screen.queryByText("review.retry")).toBeNull();
    expect(screen.queryByText("review.confirm")).toBeNull();
    expect(screen.getByText("review.processing")).toBeInTheDocument();
  });

  it("hides Confirm/MarkForReview/Retry once CONFIRMED (avoids duplicate state-machine writes)", () => {
    renderReview({ ...RECORD, status: "CONFIRMED" });
    expect(screen.queryByText("review.confirm")).toBeNull();
    expect(screen.queryByText("review.markForReview")).toBeNull();
    expect(screen.queryByText("review.retry")).toBeNull();
    // 已确认提示
    expect(screen.getByText("review.confirmed")).toBeInTheDocument();
  });

  it("renders status label via i18n key path (task-42 T9 records.* namespace)", () => {
    // t() mock 返回 key 原样；tr(statusKey("EXTRACTED_DRAFT")) → "status.EXTRACTED_DRAFT"
    renderReview();
    expect(screen.getByText("status.EXTRACTED_DRAFT")).toBeInTheDocument();
  });

  it("renders confidence label via i18n key path when confidence present", () => {
    // RECORD has confidence: "High" → tr(confidenceKey("High")) → "confidence.High"
    renderReview();
    expect(screen.getByText("confidence.High")).toBeInTheDocument();
  });

  it("renders not-found EmptyState via i18n when record is missing", () => {
    renderReview(null);
    expect(screen.getByText("notFound.title")).toBeInTheDocument();
    expect(screen.getByText("notFound.hint")).toBeInTheDocument();
  });
});

// =============================================================================
// task-48 T5：自动触发 + 轮询 + FAILED 恢复路径（D-9/F4）
// =============================================================================

describe("ReviewView · 抽取触发/轮询/FAILED（task-48）", () => {
  beforeEach(() => {
    useApiMock.mockReset();
    patchMock.mockReset();
    postMock.mockReset();
    pushMock.mockReset();
  });

  it("SOURCE_UPLOADED 挂载自动触发一次 POST trigger（D-9，useRef 防重复）", async () => {
    postMock.mockResolvedValue({});
    const refetch = vi.fn();
    useApiMock.mockReturnValue({
      data: { ...RECORD, status: "SOURCE_UPLOADED" },
      error: null,
      loading: false,
      refetch,
    });
    render(<ReviewView recordId="r1" />);

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/api/health/records/r1"),
    );
    expect(postMock).toHaveBeenCalledTimes(1);
    // 触发后 refetch（让轮询看到 PROCESSING/终态）
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it("PROCESSING 期间每 2s 轮询 refetch，卸载后停止（D-9）", () => {
    vi.useFakeTimers();
    try {
      const refetch = vi.fn();
      useApiMock.mockReturnValue({
        data: { ...RECORD, status: "PROCESSING" },
        error: null,
        loading: false,
        refetch,
      });
      const { unmount } = render(<ReviewView recordId="r1" />);

      vi.advanceTimersByTime(2000);
      expect(refetch).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(2000);
      expect(refetch).toHaveBeenCalledTimes(2);

      unmount();
      vi.advanceTimersByTime(6000);
      expect(refetch).toHaveBeenCalledTimes(2); // 卸载后不再轮询
    } finally {
      vi.useRealTimers();
    }
  });

  it("非 PROCESSING 态不轮询（终态依赖变化自然清理）", () => {
    vi.useFakeTimers();
    try {
      const refetch = vi.fn();
      useApiMock.mockReturnValue({
        data: RECORD, // EXTRACTED_DRAFT 终态
        error: null,
        loading: false,
        refetch,
      });
      render(<ReviewView recordId="r1" />);
      vi.advanceTimersByTime(10_000);
      expect(refetch).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("FAILED 态显示错误文案 + 三条恢复路径（Retry / 重新上传 / 手动录入，F4）", async () => {
    useApiMock.mockReturnValue({
      data: {
        ...RECORD,
        status: "FAILED",
        error: "PDF 暂不支持自动抽取，请手动录入",
      },
      error: null,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ReviewView recordId="r1" />);

    expect(screen.getByText("review.failedTitle")).toBeInTheDocument();
    expect(
      screen.getByText("PDF 暂不支持自动抽取，请手动录入"),
    ).toBeInTheDocument();
    expect(screen.getByText("review.retry")).toBeInTheDocument();
    expect(screen.getByText("review.reupload")).toBeInTheDocument();
    expect(screen.getByText("review.manualEntry")).toBeInTheDocument();
    // 失败态不显示 Confirm（canConfirm=false）
    expect(screen.queryByText("review.confirm")).toBeNull();

    // 重新上传 / 手动录入 → 回 My Health 页（/portal）
    fireEvent.click(screen.getByText("review.reupload"));
    expect(pushMock).toHaveBeenCalledWith("/portal");
    fireEvent.click(screen.getByText("review.manualEntry"));
    expect(pushMock).toHaveBeenCalledTimes(2);
  });
});
