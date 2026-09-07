import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：避免拉起真实 fetch ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient mock（LogForm/UploadDialog/PhotoUploadDialog 提交 + task-49 删除）──
const postMock = vi.fn();
const postFormMock = vi.fn();
const delMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    postForm: (...args: unknown[]) => postFormMock(...args),
    patch: vi.fn(),
    del: (...args: unknown[]) => delMock(...args),
  },
}));

// ── browser-image-compression：避免 jsdom 无 canvas/worker（PhotoUploadDialog 依赖）──
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (f: File) => f),
}));

// ── next-intl：返回 key 原样（便于断言）──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── mappers：透传真实实现（mapHealthRecords 需要），仅覆盖 mapSignals ──
vi.mock("./mappers", async () => {
  const actual = await vi.importActual<typeof import("./mappers")>("./mappers");
  return { ...actual, mapSignals: () => [] };
});

// ── @/i18n/navigation：useRouter stub + Link（记录行用 Link 渲染，需断言 href）──
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { HealthView } from "./HealthView";

// task-47：/api/health/records 记录列表 mock（§12 状态机 + 1:1 source）
const RECORDS = [
  {
    id: "rec_1",
    sourceId: "src_1",
    kind: "lab",
    title: "Full blood panel",
    status: "EXTRACTED_DRAFT",
    recordedAt: "2026-03-01T00:00:00.000Z",
    source: {
      id: "src_1",
      fileName: "panel.pdf",
      uploadedAt: "2026-03-01T00:00:00.000Z",
    },
  },
  {
    id: "rec_2",
    sourceId: "src_2",
    kind: "vitals",
    title: "Morning BP",
    status: "CONFIRMED",
    recordedAt: "2026-02-20T00:00:00.000Z",
    source: {
      id: "src_2",
      fileName: "Morning BP",
      uploadedAt: "2026-02-20T00:00:00.000Z",
    },
  },
];
const emptyApi = { data: [], error: null, loading: false, refetch: vi.fn() };

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  delMock.mockReset();
  pushMock.mockReset();
  // 按 path 分流：records 返回记录，signals 走空态
  useApiMock.mockImplementation((path: string) =>
    path === "/api/health/records"
      ? { data: RECORDS, error: null, loading: false, refetch: vi.fn() }
      : emptyApi,
  );
});

describe("HealthView · C1 录入入口（task-42）", () => {
  it("renders exactly the three intake buttons: Log / Upload / Photos", () => {
    render(<HealthView />);
    // C1: 三入口（Log/Upload/Photos），设备连接 Non-Scope 已剔除
    // useTranslations mock 返回 key 原样（namespace 不前缀），断言用相对 key
    expect(
      screen.getByRole("button", { name: /intake\.log\.label/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /intake\.upload\.label/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /intake\.photos\.label/ }),
    ).toBeInTheDocument();
    // 旧的设备入口不应再出现
    expect(screen.queryByText("Connect Apple Health")).toBeNull();
    expect(screen.queryByText("Import a wearable summary")).toBeNull();
  });

  it("clicking Log opens LogForm dialog", () => {
    render(<HealthView />);
    // 初始：LogForm 标题不可见
    expect(screen.queryByText("log.title")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /intake\.log\.label/ }));
    // 点击后：LogForm 标题可见
    expect(screen.getByText("log.title")).toBeInTheDocument();
  });

  it("clicking Upload opens UploadDialog (document branch)", () => {
    render(<HealthView />);
    expect(screen.queryByText("upload.title")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /intake\.upload\.label/ }),
    );
    expect(screen.getByText("upload.title")).toBeInTheDocument();
  });

  it("clicking Photos opens PhotoUploadDialog (task-46 独立照片分支)", () => {
    render(<HealthView />);
    expect(screen.queryByText("photo.title")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /intake\.photos\.label/ }),
    );
    expect(screen.getByText("photo.title")).toBeInTheDocument();
  });
});

describe("HealthView · records 列表（task-47）", () => {
  it("renders real records with §12 status badges", () => {
    render(<HealthView />);
    expect(screen.getByText("Full blood panel")).toBeInTheDocument();
    expect(screen.getByText("Morning BP")).toBeInTheDocument();
    // tr = useTranslations("records") → statusKey 原样返回
    expect(screen.getByText("status.EXTRACTED_DRAFT")).toBeInTheDocument();
    expect(screen.getByText("status.CONFIRMED")).toBeInTheDocument();
  });

  it("record row links to the review page", () => {
    render(<HealthView />);
    const link = screen.getByText("Full blood panel").closest("a");
    expect(link).toHaveAttribute("href", "/portal/health/review/rec_1");
  });

  it("no fake data constants render anymore", () => {
    render(<HealthView />);
    expect(screen.queryByText(/46 minutes later/)).toBeNull();
    expect(screen.queryByText(/June 12 lab upload/)).toBeNull();
    expect(screen.queryByText("Strength & muscle health")).toBeNull();
    expect(screen.queryByText("Lab Results")).toBeNull(); // BROWSE_CATEGORIES
  });
});

// =============================================================================
// task-49 T4 · D-1 待连接徽标 + F3 删除按钮
// =============================================================================

describe("HealthView · 待连接徽标 + 删除（task-49）", () => {
  function renderWith(records: unknown[]) {
    const refetch = vi.fn();
    useApiMock.mockImplementation((path: string) =>
      path === "/api/health/records"
        ? { data: records, error: null, loading: false, refetch }
        : emptyApi,
    );
    return { refetch, ...render(<HealthView />) };
  }

  it("CONFIRMED + 无活跃连接 + 未 dismiss → 显示待连接徽标", () => {
    renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "Confirmed lab",
        status: "CONFIRMED",
        recordedAt: "2026-03-01T00:00:00.000Z",
        connectedCount: 0,
        connectDismissedAt: null,
      },
    ]);
    expect(screen.getByText("connectHint")).toBeInTheDocument();
  });

  it("已「暂不处理」（connectDismissedAt 非空）→ 不显示徽标（D-1 抑制）", () => {
    renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "Dismissed lab",
        status: "CONFIRMED",
        recordedAt: "2026-03-01T00:00:00.000Z",
        connectedCount: 0,
        connectDismissedAt: "2026-09-01T00:00:00.000Z",
      },
    ]);
    expect(screen.queryByText("connectHint")).toBeNull();
  });

  it("已有活跃连接（connectedCount>0）→ 不显示徽标", () => {
    renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "Connected lab",
        status: "CONFIRMED",
        recordedAt: "2026-03-01T00:00:00.000Z",
        connectedCount: 1,
        connectDismissedAt: null,
      },
    ]);
    expect(screen.queryByText("connectHint")).toBeNull();
  });

  it("非 CONFIRMED 态不显示徽标", () => {
    renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "Draft lab",
        status: "EXTRACTED_DRAFT",
        recordedAt: "2026-03-01T00:00:00.000Z",
        connectedCount: 0,
        connectDismissedAt: null,
      },
    ]);
    expect(screen.queryByText("connectHint")).toBeNull();
  });

  it("点删除 → confirm 后 DELETE 被调 + 列表 refetch（F3）", async () => {
    delMock.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { refetch } = renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "To delete",
        status: "CONFIRMED",
        recordedAt: "2026-03-01T00:00:00.000Z",
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    await waitFor(() =>
      expect(delMock).toHaveBeenCalledWith("/api/health/records/rec_1"),
    );
    expect(refetch).toHaveBeenCalled();
    vi.mocked(window.confirm).mockRestore();
  });

  it("confirm 取消 → 不发 DELETE", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWith([
      {
        id: "rec_1",
        sourceId: "src_1",
        kind: "lab",
        title: "Keep me",
        status: "CONFIRMED",
        recordedAt: "2026-03-01T00:00:00.000Z",
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(delMock).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockRestore();
  });
});
