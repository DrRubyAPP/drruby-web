import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { AiStateView } from "./AiStateView";
import type { AiStateView as AiStateViewDto, Perspective } from "./mappers";

function mkView(
  state: AiStateViewDto["state"],
  overrides: Partial<AiStateViewDto> = {},
): AiStateViewDto {
  return {
    state,
    messageKey:
      state === "INSUFFICIENT_INFORMATION"
        ? "aiState.insufficient.yourself"
        : `aiState.${state.toLowerCase().replace(/_update_available/i, "")}`,
    ...overrides,
  };
}

describe("AiStateView · §24–§26 五态（task-43 T11）", () => {
  const perspective: Perspective = "yourself";

  it("LOADING → 骨架屏（不渲染 synthesis 内容）", () => {
    const { container } = render(
      <AiStateView view={mkView("LOADING")} perspective={perspective} />,
    );
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
  });

  it("READY → 不渲染状态文案（让 CurrentSynthesisPanel 显示 synthesis）", () => {
    const { container } = render(
      <AiStateView view={mkView("READY")} perspective={perspective} />,
    );
    expect(container.querySelector(".ai-state-ready")).toBeTruthy();
    expect(screen.queryByText(/aiState\./)).not.toBeInTheDocument();
  });

  it("INSUFFICIENT_INFORMATION → 三视角文案 key (§25)", () => {
    render(
      <AiStateView
        view={mkView("INSUFFICIENT_INFORMATION", {
          messageKey: "aiState.insufficient.yourself",
        })}
        perspective="yourself"
      />,
    );
    expect(
      screen.getByText("aiState.insufficient.yourself"),
    ).toBeInTheDocument();
  });

  it("INSUFFICIENT_INFORMATION Yourself 视角 → 附 Add health context CTA (§25)", () => {
    const onAddContext = vi.fn();
    render(
      <AiStateView
        view={mkView("INSUFFICIENT_INFORMATION", {
          messageKey: "aiState.insufficient.yourself",
        })}
        perspective="yourself"
        onAddHealthContext={onAddContext}
      />,
    );
    const cta = screen.getByRole("button", { name: /^addHealthContext$/ });
    fireEvent.click(cta);
    expect(onAddContext).toHaveBeenCalled();
  });

  it("INSUFFICIENT_INFORMATION Others 视角 → 不显示 Add health context CTA", () => {
    render(
      <AiStateView
        view={mkView("INSUFFICIENT_INFORMATION", {
          messageKey: "aiState.insufficient.others",
        })}
        perspective="others"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /addHealthContext/ }),
    ).not.toBeInTheDocument();
  });

  it("FAILED → 错误态 + Retry 按钮（§26 ≠ Insufficient，提供 Retry）", () => {
    const onRetry = vi.fn();
    render(
      <AiStateView
        view={mkView("FAILED", { retryable: true })}
        perspective={perspective}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("aiState.failed")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /^retry$/ });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it("FAILED 不 retryable → 不显示 Retry 按钮", () => {
    render(<AiStateView view={mkView("FAILED")} perspective={perspective} />);
    expect(
      screen.queryByRole("button", { name: /retry/ }),
    ).not.toBeInTheDocument();
  });

  it("STALE_UPDATE_AVAILABLE → 黄色提示 + pendingUntil + Update now (§26)", () => {
    const onUpdateNow = vi.fn();
    render(
      <AiStateView
        view={mkView("STALE_UPDATE_AVAILABLE", {
          pendingUntil: "2026-08-31T12:00:00.000Z",
        })}
        perspective={perspective}
        onUpdateNow={onUpdateNow}
      />,
    );
    expect(screen.getByText("aiState.stale")).toBeInTheDocument();
    const updateBtn = screen.getByRole("button", { name: /^updateNow$/ });
    fireEvent.click(updateBtn);
    expect(onUpdateNow).toHaveBeenCalled();
  });

  it("STALE_UPDATE_AVAILABLE 不带 onUpdateNow → 不显示按钮（仅提示）", () => {
    render(
      <AiStateView
        view={mkView("STALE_UPDATE_AVAILABLE", {
          pendingUntil: "2026-08-31T12:00:00.000Z",
        })}
        perspective={perspective}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /updateNow/ }),
    ).not.toBeInTheDocument();
  });
});
