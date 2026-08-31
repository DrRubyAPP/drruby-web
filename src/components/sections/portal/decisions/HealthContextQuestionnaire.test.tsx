import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

// ── apiClient.put/post mock ──
const putMock = vi.fn();
const postMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    put: (...args: unknown[]) => putMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

import type { HealthContextDto } from "./dto";
import { HealthContextQuestionnaire } from "./HealthContextQuestionnaire";

beforeEach(() => {
  putMock.mockReset();
  postMock.mockReset();
});

describe("HealthContextQuestionnaire · §19/§20/§21（task-43 T10）", () => {
  it("prefills 5 textareas from healthContext (§19 已有答案预填)", () => {
    const data: HealthContextDto = {
      healthContext: {
        symptoms: "Hot flashes",
        medications_treatments: "Magnesium",
        related_health_changes: "Perimenopausal transition",
        current_health_state: "Fatigue",
        goals_concerns: "Better sleep",
      },
      status: "unconfirmed",
    };
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={data}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Hot flashes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Magnesium")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Perimenopausal transition"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fatigue")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Better sleep")).toBeInTheDocument();
  });

  it("renders 5 empty textareas when healthContext is null (首次进入)", () => {
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{ healthContext: null, status: null }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    const textareas = screen.getAllByRole("textbox");
    expect(textareas).toHaveLength(5);
    for (const t of textareas)
      expect((t as HTMLTextAreaElement).value).toBe("");
  });

  it("unconfirmed status → 顶部提示条显示 (§20)", () => {
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{ healthContext: null, status: "unconfirmed" }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("unconfirmedBanner")).toBeInTheDocument();
  });

  it("confirmed status → 不显示 unconfirmed banner", () => {
    const { container } = render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{
          healthContext: { symptoms: "x" },
          status: "confirmed",
          healthContextConfirmedAt: "2026-08-30T00:00:00.000Z",
        }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(container.textContent).not.toContain("unconfirmedBanner");
  });

  it("Save changes → PUT /health-context with healthContext (status 保持 unconfirmed，§20)", async () => {
    const refetch = vi.fn();
    putMock.mockResolvedValueOnce({
      healthContext: { symptoms: "new" },
      status: "unconfirmed",
    });
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{ healthContext: null, status: "unconfirmed" }}
        loading={false}
        error={null}
        refetch={refetch}
      />,
    );
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], { target: { value: "new symptom" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/ }));
    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    expect(putMock).toHaveBeenCalledWith("/api/decisions/d1/health-context", {
      healthContext: expect.objectContaining({ symptoms: "new symptom" }),
      status: "unconfirmed",
    });
    expect(refetch).toHaveBeenCalled();
  });

  it("Confirm no changes → POST /health-context (status=confirmed，刷 confirmedAt，§21 gate)", async () => {
    const refetch = vi.fn();
    postMock.mockResolvedValueOnce({
      healthContext: null,
      status: "confirmed",
      healthContextConfirmedAt: "2026-08-31T00:00:00.000Z",
    });
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{ healthContext: null, status: "unconfirmed" }}
        loading={false}
        error={null}
        refetch={refetch}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirmNoChanges$/ }));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/decisions/d1/health-context");
    expect(refetch).toHaveBeenCalled();
  });

  it("Save changes button disabled while loading (防双提交)", () => {
    putMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={{ healthContext: null, status: "unconfirmed" }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    const saveBtn = screen.getByRole("button", { name: /^save$/ });
    fireEvent.click(saveBtn);
    fireEvent.click(saveBtn); // second click
    // only one in-flight call
    expect(putMock).toHaveBeenCalledTimes(1);
  });

  it("loading=true → 骨架屏", () => {
    const { container } = render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={null}
        loading={true}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
  });

  it("error 非空 → ErrorState + Retry", () => {
    const onRetry = vi.fn();
    render(
      <HealthContextQuestionnaire
        decisionId="d1"
        data={null}
        loading={false}
        error={{ message: "boom" }}
        onRetry={onRetry}
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重试/ }));
    expect(onRetry).toHaveBeenCalled();
  });
});
