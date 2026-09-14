import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DecisionDto,
  WmnResponse,
} from "@/components/sections/portal/decisions/dto";
import type { TimelineEventDto } from "@/components/sections/portal/today/YourTimeline";
import { PortalV2 } from "@/components/sections/portal-v2/PortalV2";
import { useApi } from "@/hooks/useApi";

vi.mock("@/hooks/useApi", () => ({ useApi: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

function decision(
  id: string,
  question: string,
  overrides: Partial<DecisionDto> = {},
): DecisionDto {
  return {
    id,
    question,
    goal: null,
    type: null,
    topic: null,
    topicSlug: null,
    lifecycle: "ACTIVE",
    decisionKind: null,
    outcome: null,
    nextStep: null,
    saved: false,
    yourselfContext: null,
    updated: "2026-09-14T12:00:00.000Z",
    lastUserActivityAt: "2026-09-14T12:00:00.000Z",
    ...overrides,
  };
}

function setResponses(data: WmnResponse, timeline: TimelineEventDto[] = []) {
  vi.mocked(useApi).mockImplementation((path) => ({
    data: (path?.startsWith("/api/timeline") ? timeline : data) as never,
    error: null,
    loading: false,
    refetch: vi.fn(),
  }));
}

describe("PortalV2 What matters now", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows due observations before open decisions in the API order", () => {
    setResponses({
      cards: [
        decision("due", "Check skin condition", {
          lifecycle: "OBSERVING",
          nextCheckInAt: "2026-09-13T12:00:00.000Z",
        }),
        decision("recent", "Consider Thermage", {
          lastUserActivityAt: "2026-09-14T12:00:00.000Z",
        }),
        decision("older", "Review sleep changes", {
          lastUserActivityAt: "2026-09-12T12:00:00.000Z",
        }),
      ],
      total: 3,
      actionableCount: 3,
      checkInDueCount: 1,
    });

    const { container } = render(<PortalV2 />);
    const cards = Array.from(
      container.querySelectorAll(".portal-v2__wmn-item"),
    );

    expect(useApi).toHaveBeenCalledWith("/api/decisions/wmn?portalV2=0");
    expect(cards.map((card) => card.querySelector("h4")?.textContent)).toEqual([
      "Check skin condition",
      "Consider Thermage",
      "Review sleep changes",
    ]);
    expect(cards[0]).toHaveAttribute("href", "/portal/decisions/due");
    expect(cards[0]).toHaveTextContent("Observation due");
    expect(cards[1]).toHaveAttribute("href", "/portal-v2/decisions/recent");
    expect(
      screen.queryByText("Start with what is real for you today."),
    ).toBeNull();
    expect(screen.queryByText("Currently in motion")).toBeNull();
  });

  it("shows an empty state when there are no due or open decisions", () => {
    setResponses({
      cards: [],
      total: 0,
      actionableCount: 0,
      checkInDueCount: 0,
    });

    render(<PortalV2 />);

    expect(screen.getByText(/Nothing needs your attention yet/)).toBeVisible();
  });

  it("shows user actions newest first with their details", () => {
    setResponses(
      { cards: [], total: 0, actionableCount: 0, checkInDueCount: 0 },
      [
        {
          id: "older",
          date: "2026-09-12T12:00:00.000Z",
          kind: "decision",
          title: "Started observing skin condition",
        },
        {
          id: "newer",
          date: "2026-09-14T12:00:00.000Z",
          kind: "decision",
          title: "Decided to start Thermage",
          detail: "After discussing with my clinician",
        },
      ],
    );

    const { container } = render(<PortalV2 />);
    const items = Array.from(container.querySelectorAll(".tl-item"));

    expect(useApi).toHaveBeenCalledWith("/api/timeline?portalV2=0");
    expect(
      items.map((item) => item.querySelector(".tl-t")?.textContent),
    ).toEqual([
      "Decided to start Thermage",
      "Started observing skin condition",
    ]);
    expect(items[0]).toHaveTextContent("After discussing with my clinician");
  });
});
