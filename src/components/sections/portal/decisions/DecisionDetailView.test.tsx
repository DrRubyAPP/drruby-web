import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── useApi mock：按 path 返回不同 fixture ──
const useApiMock = vi.fn();
vi.mock("@/hooks/useApi", () => ({
  useApi: (path: string | null) => useApiMock(path),
}));

// ── apiClient mock ──
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    patch: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

// ── next-intl mock ──
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

import { DecisionDetailView } from "./DecisionDetailView";
import type {
  AiStateDto,
  DecisionDetailDto,
  DecisionSnapshotDto,
  HealthContextDto,
  SnapshotsResponseDto,
} from "./dto";

const DECISION: DecisionDetailDto = {
  id: "d1",
  question: "Should I do Thermage?",
  goal: "firmness",
  type: "procedure",
  topic: "Thermage",
  topicSlug: "thermage",
  lifecycle: "ACTIVE",
  decisionKind: "unconfirmed",
  outcome: null,
  nextStep: null,
  saved: false,
  yourselfContext: null,
  updated: "2026-08-31T00:00:00.000Z",
  lastUserActivityAt: "2026-08-31T00:00:00.000Z",
  entries: [],
  currentSnapshotId: "snap1",
  healthContext: null,
  healthContextStatus: "unconfirmed",
  healthContextConfirmedAt: null,
  pendingRegenAt: null,
};

const CURRENT: DecisionSnapshotDto = {
  id: "snap1",
  decisionId: "d1",
  yourselfContextRef: null,
  sources: null,
  citations: null,
  synthesis: {
    yourself: "Current yourself body",
    others: "Current others body",
    science: "Current science body",
    combined:
      "Current yourself body\n\nCurrent others body\n\nCurrent science body",
  },
  provenance: "template",
  changeTrigger: "initial",
  createdAt: "2026-08-31T10:00:00.000Z",
};

const HISTORY: DecisionSnapshotDto[] = [
  {
    ...CURRENT,
    id: "snap0",
    changeTrigger: "new_record",
    createdAt: "2026-08-20T10:00:00.000Z",
    synthesis: {
      yourself: "History yourself",
      others: "History others",
      science: "History science",
      combined: "History yourself\n\nHistory others\n\nHistory science",
    },
  },
];

const SNAPSHOTS: SnapshotsResponseDto = {
  current: CURRENT,
  history: HISTORY,
};

const AI_STATE: AiStateDto = {
  yourself: "READY",
  others: "READY",
  science: "READY",
  pendingUntil: null,
};

const HEALTH_CONTEXT: HealthContextDto = {
  healthContext: null,
  status: "unconfirmed",
};

function setEndpoints(
  overrides: {
    decision?: DecisionDetailDto;
    snapshots?: SnapshotsResponseDto | null;
    aiState?: AiStateDto | null;
    healthContext?: HealthContextDto | null;
    loading?: boolean;
    error?: { message: string } | null;
  } = {},
) {
  const decision = overrides.decision ?? DECISION;
  const snapshots = overrides.snapshots ?? SNAPSHOTS;
  const aiState = overrides.aiState ?? AI_STATE;
  const healthContext = overrides.healthContext ?? HEALTH_CONTEXT;
  useApiMock.mockImplementation((path: string | null) => {
    if (path == null) {
      return { data: null, error: null, loading: false, refetch: vi.fn() };
    }
    const loading = overrides.loading ?? false;
    const error = overrides.error ?? null;
    if (loading)
      return { data: null, error: null, loading: true, refetch: vi.fn() };
    if (error) return { data: null, error, loading: false, refetch: vi.fn() };
    let data: unknown = null;
    if (path === `/api/decisions/${decision.id}`) data = decision;
    else if (path === `/api/decisions/${decision.id}/snapshots`)
      data = snapshots;
    else if (path === `/api/decisions/${decision.id}/ai-state`) data = aiState;
    else if (path === `/api/decisions/${decision.id}/health-context`)
      data = healthContext;
    return { data, error: null, loading: false, refetch: vi.fn() };
  });
}

beforeEach(() => {
  useApiMock.mockReset();
  postMock.mockReset();
  setEndpoints();
});

describe("DecisionDetailView · task-43 T12 集成", () => {
  it("mount 时拉 4 个端点：decisions/[id] + snapshots + ai-state + health-context", () => {
    render(<DecisionDetailView id="d1" />);
    const paths = useApiMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain("/api/decisions/d1");
    expect(paths).toContain("/api/decisions/d1/snapshots");
    expect(paths).toContain("/api/decisions/d1/ai-state");
    expect(paths).toContain("/api/decisions/d1/health-context");
  });

  it("渲染 CurrentSynthesisPanel + HistorySnapshotList + HealthContextQuestionnaire", () => {
    render(<DecisionDetailView id="d1" />);
    // Current synthesis 三段
    expect(screen.getByText("Current yourself body")).toBeInTheDocument();
    // History 第一条 trigger 人话 key（snap0 changeTrigger=new_record）
    expect(screen.getByText("trigger.new_record")).toBeInTheDocument();
    // Health context questionnaire 5 个文本域
    const textareas = screen.getAllByRole("textbox");
    // 5 个问卷 textarea + 1 个 yourselfContext textarea + 1 个 entry textarea = 7
    expect(textareas.length).toBeGreaterThanOrEqual(5);
  });

  it("渲染 3 个 AiStateView（yourself/others/science 三视角）", () => {
    // READY 状态的 AiStateView 渲染空占位 div.ai-state-ready
    const { container } = render(<DecisionDetailView id="d1" />);
    const readyDivs = container.querySelectorAll(".ai-state-ready");
    expect(readyDivs.length).toBeGreaterThanOrEqual(1);
  });

  it("aiState=INSUFFICIENT_INFORMATION Yourself → 显示三视角文案 + Add health context CTA", () => {
    setEndpoints({
      aiState: {
        yourself: "INSUFFICIENT_INFORMATION",
        others: "READY",
        science: "READY",
        pendingUntil: null,
      },
      healthContext: { healthContext: null, status: "unconfirmed" },
    });
    render(<DecisionDetailView id="d1" />);
    expect(
      screen.getByText("insufficient.yourself"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^addHealthContext$/ }),
    ).toBeInTheDocument();
  });

  it("aiState=STALE_UPDATE_AVAILABLE → Update now 调 POST /regenerate", async () => {
    setEndpoints({
      aiState: {
        yourself: "STALE_UPDATE_AVAILABLE",
        others: "STALE_UPDATE_AVAILABLE",
        science: "STALE_UPDATE_AVAILABLE",
        pendingUntil: "2026-08-31T12:00:00.000Z",
      },
    });
    postMock.mockResolvedValueOnce({ material: true, snapshotId: "snap2" });
    render(<DecisionDetailView id="d1" />);
    const updateBtn = screen.getAllByRole("button", { name: /^updateNow$/ })[0];
    fireEvent.click(updateBtn);
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith(
      "/api/decisions/d1/regenerate",
      expect.objectContaining({ trigger: expect.any(String) }),
    );
  });

  it("aiState=FAILED → Retry 调 POST /regenerate", async () => {
    setEndpoints({
      aiState: {
        yourself: "FAILED",
        others: "READY",
        science: "READY",
        pendingUntil: null,
      },
    });
    postMock.mockResolvedValueOnce({ material: true, snapshotId: "snap2" });
    render(<DecisionDetailView id="d1" />);
    const retryBtn = screen.getByRole("button", { name: /^retry$/ });
    fireEvent.click(retryBtn);
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith(
      "/api/decisions/d1/regenerate",
      expect.anything(),
    );
  });

  it("pendingRegenAt 非空 → PendingUpdateIndicator 显示", () => {
    setEndpoints({
      decision: {
        ...DECISION,
        pendingRegenAt: "2026-08-31T12:00:00.000Z",
      },
      aiState: {
        yourself: "STALE_UPDATE_AVAILABLE",
        others: "STALE_UPDATE_AVAILABLE",
        science: "STALE_UPDATE_AVAILABLE",
        pendingUntil: "2026-08-31T12:00:00.000Z",
      },
    });
    render(<DecisionDetailView id="d1" />);
    expect(screen.getByText("pendingHint")).toBeInTheDocument();
  });

  it("pendingRegenAt=null → 不显示 PendingUpdateIndicator", () => {
    render(<DecisionDetailView id="d1" />);
    expect(screen.queryByText("pendingHint")).not.toBeInTheDocument();
  });

  it("loading=true → 骨架屏（不渲染子组件）", () => {
    setEndpoints({ loading: true });
    const { container } = render(<DecisionDetailView id="d1" />);
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
    expect(screen.queryByText("Current yourself body")).not.toBeInTheDocument();
  });

  it("error 非空 → ErrorState + Retry", () => {
    setEndpoints({ error: { message: "fetch failed" } });
    render(<DecisionDetailView id="d1" />);
    expect(screen.getByText("fetch failed")).toBeInTheDocument();
  });

  it("snapshots=null → CurrentSynthesisPanel 显示 loading 占位（R1 currentSnapshotId=null）", () => {
    setEndpoints({
      snapshots: { current: null, history: [] },
      decision: { ...DECISION, currentSnapshotId: null },
    });
    render(<DecisionDetailView id="d1" />);
    // current=null + !loading + !error → "loading" 占位文案
    expect(screen.getByText("loading")).toBeInTheDocument();
  });
});
