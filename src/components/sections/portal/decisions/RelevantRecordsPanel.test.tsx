import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：按 path 分流（records 列表 / decision 关联）──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient.post mock（一键 Connect）──
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

// ── @/i18n/navigation stub ──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

import type { DecisionHealthRecordDto, HealthRecordDto } from "../health/dto";
import { RelevantRecordsPanel } from "./RelevantRecordsPanel";

/** topicSlug=hrt 的 Decision（relevance-map：hrt ↔ kind=lab / documentClass=Lab） */
const HRT_DECISION = { id: "d1", topicSlug: "hrt" };

function makeRecord(
  id: string,
  overrides: Partial<HealthRecordDto>,
): HealthRecordDto {
  return {
    id,
    sourceId: `src_${id}`,
    kind: "lab",
    title: `Record ${id}`,
    status: "CONFIRMED",
    recordedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeLink(healthRecordId: string): DecisionHealthRecordDto {
  return {
    id: `link_${healthRecordId}`,
    decisionId: "d1",
    healthRecordId,
    connectedBy: "u1",
    connectedAt: "2026-09-02T00:00:00.000Z",
    removedAt: null,
    healthRecord: makeRecord(healthRecordId, {}),
  };
}

const RECORDS: HealthRecordDto[] = [
  makeRecord("rec_lab", { title: "Hormone panel" }), // 相关 + 未连接 → 出现
  makeRecord("rec_draft", { status: "EXTRACTED_DRAFT" }), // 非 CONFIRMED → 不出现
  makeRecord("rec_skin", { kind: "symptom", documentClass: null }), // 不相关 → 不出现
  makeRecord("rec_connected", { title: "Already connected lab" }), // 已连接 → 不出现
];

function renderPanel(records = RECORDS, links = [makeLink("rec_connected")]) {
  const recordsRefetch = vi.fn();
  const linksRefetch = vi.fn();
  useApiMock.mockImplementation((path: string) => {
    if (path === "/api/health/records")
      return {
        data: records,
        error: null,
        loading: false,
        refetch: recordsRefetch,
      };
    if (path === "/api/decisions/d1/health-records")
      return {
        data: links,
        error: null,
        loading: false,
        refetch: linksRefetch,
      };
    return { data: null, error: null, loading: false, refetch: vi.fn() };
  });
  render(<RelevantRecordsPanel decisionId="d1" decision={HRT_DECISION} />);
  return { recordsRefetch, linksRefetch };
}

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
});

describe("RelevantRecordsPanel · F4 Relevant from My Health（task-49 D-3）", () => {
  it("相关 + 未连接的 CONFIRMED 记录出现；不相关/非 CONFIRMED/已连接的不出现（保守匹配）", () => {
    renderPanel();
    expect(screen.getByText("Hormone panel")).toBeInTheDocument();
    expect(screen.queryByText("Record rec_draft")).toBeNull();
    expect(screen.queryByText("Record rec_skin")).toBeNull();
    expect(screen.queryByText("Already connected lab")).toBeNull();
    // 面板标题
    expect(screen.getByText("relevant.title")).toBeInTheDocument();
  });

  it("一键 Connect → POST 现有连接端点 + 两侧 refetch", async () => {
    postMock.mockResolvedValueOnce({});
    const { recordsRefetch, linksRefetch } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "relevant.connect" }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/health-records", {
      healthRecordId: "rec_lab",
    });
    expect(recordsRefetch).toHaveBeenCalled();
    expect(linksRefetch).toHaveBeenCalled();
  });

  it("无相关建议 → 整个面板不渲染（空态隐藏）", () => {
    useApiMock.mockImplementation((path: string) => {
      if (path === "/api/health/records")
        return {
          data: [
            makeRecord("rec_skin", { kind: "symptom", documentClass: null }),
          ],
          error: null,
          loading: false,
          refetch: vi.fn(),
        };
      return { data: [], error: null, loading: false, refetch: vi.fn() };
    });
    const { container } = render(
      <RelevantRecordsPanel decisionId="d1" decision={HRT_DECISION} />,
    );
    expect(screen.queryByText("relevant.title")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("loading 期间不渲染", () => {
    useApiMock.mockImplementation(() => ({
      data: null,
      error: null,
      loading: true,
      refetch: vi.fn(),
    }));
    render(<RelevantRecordsPanel decisionId="d1" decision={HRT_DECISION} />);
    expect(screen.queryByText("relevant.title")).toBeNull();
  });
});
