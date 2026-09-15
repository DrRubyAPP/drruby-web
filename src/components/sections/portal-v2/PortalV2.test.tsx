import { fireEvent, render, screen } from "@testing-library/react";
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

describe("PortalV2 My Health", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows symptoms as conditions and treatments in their own section", () => {
    vi.mocked(useApi).mockImplementation((path) => ({
      data: (path?.startsWith("/api/health/records")
        ? [
            {
              id: "blood-pressure",
              sourceId: "source-blood-pressure",
              kind: "vitals",
              metricCode: "blood_pressure",
              displayName: "Blood pressure",
              title: "Morning BP check-in",
              status: "CONFIRMED",
              parsedValues: {
                items: [
                  {
                    name: "Systolic blood pressure",
                    value: 120,
                    unit: "mmHg",
                  },
                  {
                    name: "Diastolic blood pressure",
                    value: 80,
                    unit: "mmHg",
                  },
                ],
              },
              recordedAt: "2026-09-13T09:00:00.000Z",
            },
            {
              id: "older-blood-pressure",
              sourceId: "source-older-blood-pressure",
              kind: "vitals",
              metricCode: "blood_pressure",
              displayName: "Blood pressure",
              title: "Evening BP check-in",
              status: "CONFIRMED",
              recordedAt: "2026-09-01T09:00:00.000Z",
            },
            {
              id: "medication",
              sourceId: "source-medication",
              kind: "medication",
              title: "Tretinoin",
              status: "CONFIRMED",
              parsedValues: { dosage: "0.025%" },
              recordedAt: "2026-09-12T09:00:00.000Z",
            },
            {
              id: "medication-extra",
              sourceId: "source-medication-extra",
              kind: "medication",
              title: "CoQ10",
              status: "CONFIRMED",
              parsedValues: { dosage: "100 mg" },
              recordedAt: "2026-09-01T09:00:00.000Z",
            },
            {
              id: "symptom",
              sourceId: "source-symptom",
              kind: "symptom",
              title: "Hot flashes check-in",
              status: "CONFIRMED",
              parsedValues: { severity: "moderate" },
              recordedAt: "2026-09-02T09:00:00.000Z",
            },
            {
              id: "checkup",
              sourceId: "source-checkup",
              kind: "checkup",
              title: "Annual wellness visit",
              status: "CONFIRMED",
              recordedAt: "2026-09-11T09:00:00.000Z",
            },
            {
              id: "treatment",
              sourceId: "source-treatment",
              kind: "treatment",
              title: "Started Thermage",
              status: "CONFIRMED",
              parsedValues: { frequency: "monthly" },
              recordedAt: "2026-09-14T09:00:00.000Z",
            },
          ]
        : path?.startsWith("/api/timeline")
          ? []
          : {
              cards: [],
              total: 0,
              actionableCount: 0,
              checkInDueCount: 0,
            }) as never,
      error: null,
      loading: false,
      refetch: vi.fn(),
    }));

    render(<PortalV2 />);
    fireEvent.click(screen.getByRole("button", { name: /My Health/ }));

    expect(screen.getByRole("heading", { name: "Conditions" })).toBeVisible();
    expect(screen.getByText("Hot flashes check-in")).toBeVisible();
    expect(screen.queryByText("Annual wellness visit")).toBeNull();
    expect(screen.getByRole("heading", { name: "Treatments" })).toBeVisible();
    expect(screen.getByText("Started Thermage")).toBeVisible();
    expect(screen.getByText("Blood pressure")).toBeVisible();
    expect(screen.getByText("120 / 80 mmHg")).toBeVisible();
    expect(screen.getByText("0.025%")).toBeVisible();
    expect(screen.getByText("CoQ10")).toBeVisible();
    expect(screen.getByText("monthly")).toBeVisible();
    expect(screen.getByLabelText("Severity: moderate")).toBeVisible();
    expect(screen.queryByText("Morning BP check-in")).toBeNull();
    expect(screen.queryByText("Evening BP check-in")).toBeNull();

    fireEvent.click(screen.getByText("Blood pressure"));
    expect(screen.getByRole("dialog")).toHaveTextContent("Blood pressure");
    expect(
      screen.getByRole("img", { name: "Blood pressure history line chart" }),
    ).toBeVisible();
    expect(screen.getByText(/Systolic/)).toBeVisible();
    expect(screen.getByText(/Diastolic/)).toBeVisible();
    const systolicPoint = screen
      .getByRole("dialog")
      .querySelector(".portal-v2__chart-point--systolic:not(.is-missing)");
    expect(systolicPoint).not.toBeNull();
    fireEvent.mouseEnter(systolicPoint!);
    expect(
      screen.getByRole("dialog").querySelector(".portal-v2__chart-tooltip"),
    ).toHaveTextContent(/systolic 120 mmHg/);

    fireEvent.click(screen.getByLabelText("Close history"));
    fireEvent.click(screen.getByText("Started Thermage"));
    expect(screen.getByRole("dialog")).toHaveTextContent("monthly");
    expect(
      screen.queryByRole("img", { name: "Metric history line chart" }),
    ).toBeNull();

    fireEvent.click(screen.getByLabelText("Close history"));
    fireEvent.click(screen.getByText("Hot flashes check-in"));
    const severityPoint = screen
      .getByRole("dialog")
      .querySelector(".portal-v2__chart-point");
    expect(severityPoint).not.toBeNull();
    fireEvent.mouseEnter(severityPoint!);
    expect(
      screen.getByRole("dialog").querySelector(".portal-v2__chart-tooltip"),
    ).toHaveTextContent("Severity: moderate");
  });
});
