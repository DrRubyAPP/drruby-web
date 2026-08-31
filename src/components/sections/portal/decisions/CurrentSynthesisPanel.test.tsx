import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ── next-intl：返回 key 原样（便于断言 i18n key）──
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ── @/i18n/navigation stub（防止 UnauthorizedRedirect 传递引入 next/navigation）──
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => "/",
  getPathname: vi.fn(),
}));

import { CurrentSynthesisPanel } from "./CurrentSynthesisPanel";
import type { DecisionSnapshotDto } from "./dto";

const mkSnapshot = (
  overrides: Partial<DecisionSnapshotDto> = {},
): DecisionSnapshotDto => ({
  id: "snap1",
  decisionId: "d1",
  yourselfContextRef: null,
  sources: null,
  citations: null,
  synthesis: {
    yourself: "Yourself body text",
    others: "Others body text",
    science: "Science body text",
    combined: "Yourself body text\n\nOthers body text\n\nScience body text",
  },
  provenance: "template",
  changeTrigger: "new_record",
  createdAt: "2026-08-31T10:00:00.000Z",
  ...overrides,
});

describe("CurrentSynthesisPanel · §15 Current 综合（task-43 T9）", () => {
  it("renders three perspective sections (yourself/others/science) + combined", () => {
    render(
      <CurrentSynthesisPanel
        current={mkSnapshot()}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("yourself")).toBeInTheDocument();
    expect(screen.getByText("Yourself body text")).toBeInTheDocument();
    expect(screen.getByText("others")).toBeInTheDocument();
    expect(screen.getByText("Others body text")).toBeInTheDocument();
    expect(screen.getByText("science")).toBeInTheDocument();
    expect(screen.getByText("Science body text")).toBeInTheDocument();
  });

  it("loading=true → 骨架屏（不渲染 synthesis）", () => {
    const { container } = render(
      <CurrentSynthesisPanel current={null} loading={true} error={null} />,
    );
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
    expect(screen.queryByText("Yourself body text")).not.toBeInTheDocument();
  });

  it("error 非空 → ErrorState + Retry 按钮", () => {
    const onRetry = vi.fn();
    render(
      <CurrentSynthesisPanel
        current={null}
        loading={false}
        error={{ message: "fetch failed" }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("fetch failed")).toBeInTheDocument();
    // ErrorState 按钮文本硬编码 "重试"
    fireEvent.click(screen.getByRole("button", { name: /重试/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("current=null + !loading + !error → 首版生成中占位（R1 兜底）", () => {
    render(
      <CurrentSynthesisPanel current={null} loading={false} error={null} />,
    );
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("provenance=template+llm_trigger_degraded → 小字标注 degraded（R6 透明化）", () => {
    render(
      <CurrentSynthesisPanel
        current={mkSnapshot({ provenance: "template+llm_trigger_degraded" })}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("degradedHint")).toBeInTheDocument();
  });

  it("provenance=template → 不显示 degraded 标注", () => {
    render(
      <CurrentSynthesisPanel
        current={mkSnapshot({ provenance: "template" })}
        loading={false}
        error={null}
      />,
    );
    expect(screen.queryByText("degradedHint")).not.toBeInTheDocument();
  });

  it("provenance=initial → 不显示 degraded 标注（首版不属降级）", () => {
    render(
      <CurrentSynthesisPanel
        current={mkSnapshot({
          provenance: "initial",
          changeTrigger: "initial",
        })}
        loading={false}
        error={null}
      />,
    );
    expect(screen.queryByText("degradedHint")).not.toBeInTheDocument();
  });

  it("synthesis=null → 占位（防御，理论不出现）", () => {
    render(
      <CurrentSynthesisPanel
        current={mkSnapshot({ synthesis: null })}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
