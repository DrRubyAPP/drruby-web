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

describe("POST /api/portal-v2/intake", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("records an accepted skin-condition observation in My Health", async () => {
    const { POST } = await import("./route");
    const { prisma } = await import("@/lib/db/prisma");
    const user = await makeUser("skin-observation@example.com");
    const decision = await prisma.decision.create({
      data: {
        userId: user.id,
        question: "I started a retinoid",
        topic: "retinoid",
        lifecycle: "DECIDED",
        decisionKind: "action",
        outcome: "decided_to_do_it",
        decidedAt: new Date(),
      },
    });

    asUser(user.id);
    const response = await POST(
      jsonRequest({
        text: "yes",
        pendingAction: {
          type: "suggest_tracking",
          decisionId: decision.id,
          title: "Skin condition",
          cadence: "weekly",
        },
      }),
    );

    expect(response.status).toBe(200);
    const record = await prisma.healthRecord.findFirstOrThrow({
      where: {
        userId: user.id,
        kind: "symptom",
        metricCode: "skin_condition",
      },
      include: { decisions: true },
    });
    expect(record.title).toBe("Skin condition observation started");
    expect(record.parsedValues).toMatchObject({
      cadence: "weekly",
      valueType: "qualitative",
    });
    expect(record.decisions).toHaveLength(1);
    expect(record.decisions[0]?.decisionId).toBe(decision.id);
  });
});
