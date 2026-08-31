import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import type { DecisionSnapshotDto } from "./dto";
import { HistorySnapshotList } from "./HistorySnapshotList";

const mkSnapshot = (
  id: string,
  overrides: Partial<DecisionSnapshotDto> = {},
): DecisionSnapshotDto => ({
  id,
  decisionId: "d1",
  yourselfContextRef: null,
  sources: null,
  citations: null,
  synthesis: {
    yourself: `Yourself ${id}`,
    others: `Others ${id}`,
    science: `Science ${id}`,
    combined: `Combined ${id}`,
  },
  provenance: "template",
  changeTrigger: "new_record",
  createdAt: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

describe("HistorySnapshotList · §15/§23 History（task-43 T9）", () => {
  it("renders history entries with trigger label key + date", () => {
    const history = [
      mkSnapshot("snap2", {
        createdAt: "2026-08-20T10:00:00.000Z",
        changeTrigger: "new_record",
      }),
      mkSnapshot("snap1", {
        createdAt: "2026-08-10T10:00:00.000Z",
        changeTrigger: "health_context_update",
      }),
    ];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    // 每条都显示 trigger i18n key（namespace "decisions.snapshot"，mock 返回 leaf 原样）
    const newRecordKeys = screen.getAllByText("trigger.new_record");
    expect(newRecordKeys).toHaveLength(1);
    expect(
      screen.getByText("trigger.health_context_update"),
    ).toBeInTheDocument();
  });

  it("renders triggerHumanLabel preferentially when present (D1 LLM 文案)", () => {
    const history = [
      mkSnapshot("snap1", {
        createdAt: "2026-08-10T10:00:00.000Z",
        triggerHumanLabel: "Added a new lab panel from August",
      }),
    ];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    expect(
      screen.getByText("Added a new lab panel from August"),
    ).toBeInTheDocument();
    // triggerLabelKey 不应同时显示（triggerHumanLabel 优先）
    expect(screen.queryByText("trigger.new_record")).not.toBeInTheDocument();
  });

  it("expand button reveals full synthesis 三段（当时我知道什么）", () => {
    const history = [
      mkSnapshot("snap1", {
        createdAt: "2026-08-10T10:00:00.000Z",
      }),
    ];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    // 初始：combined 摘要可见，三段隐藏
    expect(screen.getByText("Combined snap1")).toBeInTheDocument();
    expect(screen.queryByText("Yourself snap1")).not.toBeInTheDocument();
    // 点击展开（mock 返回 "expand"）
    fireEvent.click(screen.getByRole("button", { name: /^expand$/ }));
    expect(screen.getByText("Yourself snap1")).toBeInTheDocument();
    expect(screen.getByText("Others snap1")).toBeInTheDocument();
    expect(screen.getByText("Science snap1")).toBeInTheDocument();
  });

  it("collapse button hides synthesis after expand", () => {
    const history = [mkSnapshot("snap1")];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    const expandBtn = screen.getByRole("button", { name: /^expand$/ });
    fireEvent.click(expandBtn);
    expect(screen.getByText("Yourself snap1")).toBeInTheDocument();
    // 再点收起（mock 返回 "collapse"）
    fireEvent.click(screen.getByRole("button", { name: /^collapse$/ }));
    expect(screen.queryByText("Yourself snap1")).not.toBeInTheDocument();
  });

  it("loading=true → 骨架屏", () => {
    const { container } = render(
      <HistorySnapshotList history={[]} loading={true} error={null} />,
    );
    expect(container.querySelector(".api-skeleton")).toBeTruthy();
  });

  it("error 非空 → ErrorState + Retry", () => {
    const onRetry = vi.fn();
    render(
      <HistorySnapshotList
        history={[]}
        loading={false}
        error={{ message: "boom" }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重试/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("empty history + !loading + !error → empty hint", () => {
    render(<HistorySnapshotList history={[]} loading={false} error={null} />);
    expect(screen.getByText("historyEmpty")).toBeInTheDocument();
  });

  it("provenance degraded → 小字标注（R6 历史也透明化）", () => {
    const history = [
      mkSnapshot("snap1", { provenance: "template+llm_trigger_degraded" }),
    ];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    expect(screen.getByText("degradedHint")).toBeInTheDocument();
  });

  it("renders multiple entries in given order (父组件已 DESC 排序)", () => {
    const history = [
      mkSnapshot("snap2", { createdAt: "2026-08-20T10:00:00.000Z" }),
      mkSnapshot("snap1", { createdAt: "2026-08-10T10:00:00.000Z" }),
    ];
    render(
      <HistorySnapshotList history={history} loading={false} error={null} />,
    );
    // 用 trigger key 定位（snap2 先于 snap1，按父组件给的顺序）
    const items = screen.getAllByText(/Combined snap/);
    expect(items.map((e) => e.textContent)).toEqual([
      "Combined snap2",
      "Combined snap1",
    ]);
  });
});
