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
