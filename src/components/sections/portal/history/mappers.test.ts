import { describe, expect, it } from "vitest";
import type { TimelineEventDto } from "./dto";
import { KIND_LABEL, mapTimeline } from "./mappers";

const dto = (overrides: Partial<TimelineEventDto> = {}): TimelineEventDto => ({
  id: "e1",
  date: "2026-05-14T09:30:00.000Z",
  kind: "decision",
  title: "Started tretinoin",
  ...overrides,
});

describe("KIND_LABEL", () => {
  it("maps all 6 kinds", () => {
    expect(KIND_LABEL.note).toBe("Reflection");
    expect(KIND_LABEL.treatment).toBe("Treatment");
    expect(KIND_LABEL.photo).toBe("Photo");
    expect(KIND_LABEL.lab).toBe("Lab");
    expect(KIND_LABEL.decision).toBe("Decision");
    expect(KIND_LABEL.outcome).toBe("Outcome");
  });
});

describe("mapTimeline", () => {
  it("empty array → empty items, hasMore=false", () => {
    expect(mapTimeline([], 20)).toEqual({ items: [], hasMore: false });
  });

  it("visibleCount=0 → empty items (boundary)", () => {
    expect(mapTimeline([dto()], 0)).toEqual({ items: [], hasMore: true });
  });

  it("length === visibleCount → hasMore=false (exactly one page)", () => {
    const arr = Array.from({ length: 20 }, (_, i) => dto({ id: `e${i}` }));
    const page = mapTimeline(arr, 20);
    expect(page.items).toHaveLength(20);
    expect(page.hasMore).toBe(false);
  });

  it("length > visibleCount → sliced + hasMore=true", () => {
    const arr = Array.from({ length: 25 }, (_, i) => dto({ id: `e${i}` }));
    const page = mapTimeline(arr, 20);
    expect(page.items).toHaveLength(20);
    expect(page.items[0].id).toBe("e0");
    expect(page.items[19].id).toBe("e19");
    expect(page.hasMore).toBe(true);
  });

  it("length === visibleCount + 1 → hasMore=true (boundary, one more after page)", () => {
    const arr = Array.from({ length: 21 }, (_, i) => dto({ id: `e${i}` }));
    expect(mapTimeline(arr, 20).hasMore).toBe(true);
  });

  it("ISO date → Date object (absolute time, no TZ shift in mapper)", () => {
    const page = mapTimeline([dto({ date: "2026-05-14T09:30:00.000Z" })], 20);
    expect(page.items[0].date).toEqual(new Date("2026-05-14T09:30:00.000Z"));
  });

  it("kind → label mapping for all 6 kinds", () => {
    const cases: Array<[TimelineEventDto["kind"], string]> = [
      ["note", "Reflection"],
      ["treatment", "Treatment"],
      ["photo", "Photo"],
      ["lab", "Lab"],
      ["decision", "Decision"],
      ["outcome", "Outcome"],
    ];
    for (const [kind, label] of cases) {
      const page = mapTimeline([dto({ kind, id: `k-${kind}` })], 20);
      expect(page.items[0].label).toBe(label);
    }
  });

  it("detail/source present → hasDetail=true / hasSource=true", () => {
    const page = mapTimeline(
      [dto({ detail: "dryness peaked", source: "weekly check-in" })],
      20,
    );
    expect(page.items[0]).toMatchObject({
      detail: "dryness peaked",
      hasDetail: true,
      source: "weekly check-in",
      hasSource: true,
    });
  });

  it("detail/source missing → hasDetail=false / hasSource=false, value=''", () => {
    const page = mapTimeline([dto()], 20); // detail/source 缺省
    expect(page.items[0]).toMatchObject({
      detail: "",
      hasDetail: false,
      source: "",
      hasSource: false,
    });
  });

  it("detail/source whitespace-only → hasDetail=false / hasSource=false (trim)", () => {
    const page = mapTimeline([dto({ detail: "   ", source: "\t\n" })], 20);
    expect(page.items[0].hasDetail).toBe(false);
    expect(page.items[0].hasSource).toBe(false);
  });

  it("unknown kind → fallback to capitalized kind (defensive)", () => {
    // dto.kind 已被 schema 约束，但 mapper 防御性兜底
    const page = mapTimeline(
      [dto({ kind: "unknown" as TimelineEventDto["kind"] })],
      20,
    );
    expect(page.items[0].label).toBe("Unknown");
  });
});
