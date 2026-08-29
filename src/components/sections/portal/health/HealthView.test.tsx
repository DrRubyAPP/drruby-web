import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：避免拉起真实 fetch ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.post mock（LogForm/UploadDialog 提交）──
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: vi.fn(),
  },
}));

// ── next-intl：返回 key 原样（便于断言）──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── mapSignals stub（避免引入真实 mapper）──
vi.mock("./mappers", () => ({
  mapSignals: () => [],
}));

// ── useRouter stub（避免 HealthView 内部 router 调用真实导航）──
const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { HealthView } from "./HealthView";

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  pushMock.mockReset();
  // /api/signals 默认空数组，避免 loading/error 分支
  useApiMock.mockReturnValue({
    data: [],
    error: null,
    loading: false,
    refetch: vi.fn(),
  });
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

  it("clicking Upload opens UploadDialog (covers Photos too — same dialog)", () => {
    render(<HealthView />);
    expect(screen.queryByText("upload.title")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /intake\.upload\.label/ }),
    );
    expect(screen.getByText("upload.title")).toBeInTheDocument();
  });
});
