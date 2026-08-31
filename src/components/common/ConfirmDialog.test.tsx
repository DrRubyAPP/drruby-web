import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

const PROPS = {
  title: "Stop observing",
  message: "Stop this observation cycle? Your records will be kept.",
  confirmLabel: "Stop observing",
  confirmingLabel: "Stopping…",
  cancelLabel: "Cancel",
};

describe("ConfirmDialog", () => {
  it("open=false 时不渲染", () => {
    const { container } = render(
      <ConfirmDialog
        {...PROPS}
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("open 时渲染标题 + 正文 + 两个按钮", () => {
    render(
      <ConfirmDialog {...PROPS} open onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    // 标题与确认按钮文案相同 → getAllByText
    expect(screen.getAllByText("Stop observing").length).toBeGreaterThanOrEqual(
      2,
    );
    expect(
      screen.getByText(
        "Stop this observation cycle? Your records will be kept.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("确认按钮触发 onConfirm；取消按钮触发 onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...PROPS}
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    // 确认 = 弹窗内的红色按钮（后渲染）；取消在前
    const [cancelBtn, confirmBtn] = screen.getAllByRole("button");
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("loading=true：显示 confirmingLabel 且两按钮禁用", () => {
    render(
      <ConfirmDialog
        {...PROPS}
        open
        loading
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Stopping…")).toBeInTheDocument();
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });

  it("Esc 触发 onCancel", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...PROPS} open onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("loading 中 Esc 不触发 onCancel", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...PROPS}
        open
        loading
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
