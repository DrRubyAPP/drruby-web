import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "@/components/api/ErrorState";

describe("ErrorState", () => {
  it("renders message and retry fires callback", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="加载失败" onRetry={onRetry} />);
    expect(screen.getByText("加载失败")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("no retry button when onRetry omitted", () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
