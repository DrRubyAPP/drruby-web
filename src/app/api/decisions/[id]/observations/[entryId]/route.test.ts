import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  jsonRequest,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

function entryParams(id: string, entryId: string) {
  return { params: Promise.resolve({ id, entryId }) };
}

/** 造 OBSERVING decision + 一条 observation entry（含固定 occurredAt/createdAt） */
async function createObservingDecisionWithObservation(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  const decision = await prisma.decision.create({
    data: {
      userId,
      question: "observe-patch",
      lifecycle: "OBSERVING",
      decisionKind: "action",
      outcome: "decided_to_do_it",
      decidedAt: new Date(),
      observeBaseline: { text: "baseline", freq: "weekly" },
      nextCheckInAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const occurredAt = new Date("2026-01-01T00:00:00.000Z");
  const entry = await prisma.decisionEntry.create({
    data: {
      decisionId: decision.id,
      userId,
      text: "original",
      lifecycleSnapshot: "OBSERVING",
      kind: "observation",
      direction: "better",
      occurredAt,
      createdAt: occurredAt,
    },
  });
  return { decision, entry };
}

describe("PATCH /api/decisions/[id]/observations/[entryId]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("修正 direction/text + append-only 不改 occurredAt/createdAt", async () => {
    const { PATCH } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("obs-patch@example.com");
    const { decision, entry } =
      await createObservingDecisionWithObservation(owner.id);

    asUser(owner.id);
    const res = await PATCH(
      jsonRequest(
        { text: "corrected", direction: "worse" },
        { method: "PATCH" },
      ),
      entryParams(decision.id, entry.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("corrected");
    expect(body.direction).toBe("worse");

    // append-only：occurredAt/createdAt 不变
    const after = await prisma.decisionEntry.findUnique({
      where: { id: entry.id },
    });
    expect(after?.occurredAt.toISOString()).toBe(
      entry.occurredAt.toISOString(),
    );
    expect(after?.createdAt.toISOString()).toBe(
      entry.createdAt.toISOString(),
    );
  });

  it("direction 可显式清空（null）", async () => {
    const { PATCH } = await import("./route");
    const owner = await makeUser("obs-clear@example.com");
    const { decision, entry } =
      await createObservingDecisionWithObservation(owner.id);

    asUser(owner.id);
    const res = await PATCH(
      jsonRequest({ direction: null }, { method: "PATCH" }),
      entryParams(decision.id, entry.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.direction).toBe(null);
  });

  it("synthesis 可修正：photos/recordRefs 落库", async () => {
    const { PATCH } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const owner = await makeUser("obs-synth@example.com");
    const { decision, entry } =
      await createObservingDecisionWithObservation(owner.id);

    asUser(owner.id);
    const res = await PATCH(
      jsonRequest(
        {
          synthesis: {
            photos: [{ recordId: "rec-1", summary: "skin photo" }],
            recordRefs: [{ recordId: "rec-2" }],
          },
        },
        { method: "PATCH" },
      ),
      entryParams(decision.id, entry.id),
    );
    expect(res.status).toBe(200);
    const after = await prisma.decisionEntry.findUnique({
      where: { id: entry.id },
    });
    expect(after?.synthesis).toMatchObject({
      photos: [{ recordId: "rec-1", summary: "skin photo" }],
      recordRefs: [{ recordId: "rec-2" }],
    });
  });

  it("entryId 不属于该 decision → 404（不泄露存在性）", async () => {
    const { PATCH } = await import("./route");
    const owner = await makeUser("obs-cross@example.com");
    // decision A + entry 属于 decision B（同一 owner）
    const { decision: decisionA } =
      await createObservingDecisionWithObservation(owner.id);
    const { decision: decisionB, entry: entryB } =
      await createObservingDecisionWithObservation(owner.id);

    asUser(owner.id);
    const res = await PATCH(
      jsonRequest({ text: "sneaky" }, { method: "PATCH" }),
      entryParams(decisionA.id, entryB.id),
    );
    expect(res.status).toBe(404);
  });

  it("越权 → 404", async () => {
    const { PATCH } = await import("./route");
    const owner = await makeUser("obs-patch-real@example.com");
    const intruder = await makeUser("obs-patch-intruder@example.com");
    const { decision, entry } =
      await createObservingDecisionWithObservation(owner.id);

    asUser(intruder.id);
    const res = await PATCH(
      jsonRequest({ text: "sneaky" }, { method: "PATCH" }),
      entryParams(decision.id, entry.id),
    );
    expect(res.status).toBe(404);
  });
});
