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

import { PendingUpdateIndicator } from "./PendingUpdateIndicator";

describe("PendingUpdateIndicator · D6 STALE 可视化（task-43 T11）", () => {
  it("pendingUntil 非空 → 显示 update pending 提示 + Update now 按钮", () => {
    const onUpdateNow = vi.fn();
    render(
      <PendingUpdateIndicator
        pendingUntil="2026-08-31T12:00:00.000Z"
        onUpdateNow={onUpdateNow}
      />,
    );
    expect(screen.getByText("pendingHint")).toBeInTheDocument();
    expect(screen.getByText(/8\/31\/2026|2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^updateNow$/ }));
    expect(onUpdateNow).toHaveBeenCalled();
  });

  it("pendingUntil=null → 不渲染任何提示", () => {
    const { container } = render(
      <PendingUpdateIndicator pendingUntil={null} onUpdateNow={vi.fn()} />,
    );
    expect(container.textContent).toBe("");
  });

  it("pendingUntil 非空但无 onUpdateNow → 只显示提示，不显示按钮", () => {
    render(<PendingUpdateIndicator pendingUntil="2026-08-31T12:00:00.000Z" />);
    expect(screen.getByText("pendingHint")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /updateNow/ }),
    ).not.toBeInTheDocument();
  });
});
