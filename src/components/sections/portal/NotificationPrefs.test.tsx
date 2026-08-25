import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const getMock = vi.fn();
const putMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    put: (...args: unknown[]) => putMock(...args),
    post: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { NotificationPrefs } from "./NotificationPrefs";

beforeEach(() => {
  getMock.mockReset();
  putMock.mockReset();
});

describe("NotificationPrefs", () => {
  it("GET 加载 4 个开关（默认全开）", async () => {
    getMock.mockResolvedValueOnce([
      { key: "weekly_digest", enabled: true },
      { key: "decision_followups", enabled: true },
      { key: "study_updates", enabled: true },
      { key: "product_updates", enabled: true },
    ]);
    render(<NotificationPrefs />);
    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith("/api/notification-preferences"),
    );
    await waitFor(() =>
      expect(
        screen.getByText("notifications.weeklyDigest"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText("notifications.decisionFollowups"),
    ).toBeInTheDocument();
    expect(screen.getByText("notifications.studyUpdates")).toBeInTheDocument();
    expect(
      screen.getByText("notifications.productUpdates"),
    ).toBeInTheDocument();
  });

  it("点击开关 → PUT 携带 { key, enabled }（乐观更新）", async () => {
    getMock.mockResolvedValueOnce([
      { key: "weekly_digest", enabled: true },
      { key: "decision_followups", enabled: true },
      { key: "study_updates", enabled: true },
      { key: "product_updates", enabled: true },
    ]);
    putMock.mockResolvedValueOnce({ key: "weekly_digest", enabled: false });
    render(<NotificationPrefs />);
    await waitFor(() =>
      expect(
        screen.getByText("notifications.weeklyDigest"),
      ).toBeInTheDocument(),
    );

    const toggle = screen.getByLabelText("notifications.weeklyDigest");
    expect(toggle).toHaveProperty("checked", true);
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith("/api/notification-preferences", {
        key: "weekly_digest",
        enabled: false,
      }),
    );
  });

  it("PUT 失败 → 回滚 + 错误提示", async () => {
    getMock.mockResolvedValueOnce([
      { key: "weekly_digest", enabled: true },
      { key: "decision_followups", enabled: true },
      { key: "study_updates", enabled: true },
      { key: "product_updates", enabled: true },
    ]);
    putMock.mockRejectedValueOnce(new ApiError("network_error", 0, "boom"));
    render(<NotificationPrefs />);
    await waitFor(() =>
      expect(
        screen.getByText("notifications.weeklyDigest"),
      ).toBeInTheDocument(),
    );

    const toggle = screen.getByLabelText("notifications.weeklyDigest");
    fireEvent.click(toggle);
    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    // 回滚：仍勾选
    await waitFor(() => expect(toggle).toHaveProperty("checked", true));
    expect(screen.getByText("notifications.error")).toBeInTheDocument();
  });

  it("GET 失败 → 错误态 + 重试", async () => {
    getMock.mockRejectedValueOnce(new ApiError("internal_error", 500, "boom"));
    render(<NotificationPrefs />);
    await waitFor(() =>
      expect(screen.getByText("notifications.error")).toBeInTheDocument(),
    );

    getMock.mockResolvedValueOnce([
      { key: "weekly_digest", enabled: true },
      { key: "decision_followups", enabled: true },
      { key: "study_updates", enabled: true },
      { key: "product_updates", enabled: true },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() =>
      expect(
        screen.getByText("notifications.weeklyDigest"),
      ).toBeInTheDocument(),
    );
  });
});
