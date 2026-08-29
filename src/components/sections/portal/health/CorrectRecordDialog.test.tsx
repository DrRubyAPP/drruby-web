import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── apiClient.patch mock ──
const patchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: (...args: unknown[]) => patchMock(...args),
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

import { CorrectRecordDialog } from "./CorrectRecordDialog";
import type { HealthRecordDto } from "./dto";

const RECORD: HealthRecordDto = {
  id: "r1",
  sourceId: "s1",
  kind: "lab",
  title: "June Lab Panel",
  status: "EXTRACTED_DRAFT",
  confidence: "Low",
  documentClass: "Lab",
  parsedValues: {
    items: [{ name: "LDL", value: "168", unit: "mg/dL" }],
  },
  pleaseConfirm: ["mock_field_unverified"],
  recordedAt: "2026-06-12T10:00:00.000Z",
  revisions: [
    {
      id: "rev1",
      diffSummary: "fixed LDL unit",
      correctedBy: "u1",
      correctedAt: "2026-06-13T10:00:00.000Z",
      reason: "typo",
    },
  ],
};

beforeEach(() => {
  patchMock.mockReset();
});

describe("CorrectRecordDialog · C7 纠错 + provenance（task-42）", () => {
  it("shows existing revision history (provenance trail)", () => {
    render(<CorrectRecordDialog record={RECORD} open onClose={() => {}} />);
    // provenance trail 可见
    expect(screen.getByText("provenance.title")).toBeInTheDocument();
    expect(screen.getByText(/fixed LDL unit/)).toBeInTheDocument();
  });

  it("shows empty hint when no revisions exist", () => {
    render(
      <CorrectRecordDialog
        record={{ ...RECORD, revisions: [] }}
        open
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("provenance.empty")).toBeInTheDocument();
  });

  it("Save → PATCH /api/health/records/[id] action=correct with new values + summary", async () => {
    patchMock.mockResolvedValueOnce({});
    const onClose = vi.fn();
    render(<CorrectRecordDialog record={RECORD} open onClose={onClose} />);
    // 编辑 summary
    const summaryInput = screen.getByLabelText("correct.summaryLabel");
    fireEvent.change(summaryInput, { target: { value: "wrong unit" } });
    fireEvent.click(screen.getByRole("button", { name: "correct.save" }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledTimes(1));
    expect(patchMock).toHaveBeenCalledWith("/api/health/records/r1", {
      action: "correct",
      parsedValues: expect.any(Object),
      diffSummary: "wrong unit",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
