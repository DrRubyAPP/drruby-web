import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { update as updateDecision } from "@/lib/db/repositories/decision.repo";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

/** 隔开各行的 lastUserActivityAt（DB 毫秒精度，避免同毫秒并列导致排序不稳） */
const tick = () => new Promise((r) => setTimeout(r, 5));

describe("GET /api/decisions/wmn", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    asAnonymous();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("空用户 → cards=[]、total=0、actionableCount=0、checkInDueCount=0", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("wmn-empty@example.com");
    asUser(user.id);
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      cards: [],
      total: 0,
      actionableCount: 0,
      checkInDueCount: 0,
    });
  });

  it("≤3 卡上限 + 按 lastUserActivityAt DESC（P2/P3）", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("wmn-cap@example.com");
    asUser(user.id);
    const { create: createDecision } = await import(
      "@/lib/db/repositories/decision.repo"
    );
    // 建 4 个 actionable，逐个 update 刷新 lastUserActivityAt（后动的更近）
    for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
      const d = await createDecision(user.id, {
        question: q,
        type: "not_sure",
      });
      await updateDecision(d.id, { topic: `t-${q}` }); // meaningful → 刷新排序键
      await tick();
    }
    const res = await GET();
    const body = await res.json();
    expect(body.cards).toHaveLength(3); // ≤3
    expect(body.actionableCount).toBe(4);
    expect(body.total).toBe(4);
    // 最近活动在前：Q4 最先出现
    expect(body.cards[0].question).toBe("Q4");
  });

  it("CLOSED/COMPLETED 不出现在 cards，但计入 total", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("wmn-closed@example.com");
    asUser(user.id);
    const { create: createDecision } = await import(
      "@/lib/db/repositories/decision.repo"
    );
    const active = await createDecision(user.id, {
      question: "Active",
      type: "not_sure",
    });
    const closed = await createDecision(user.id, {
      question: "Closed",
      type: "not_sure",
    });
    await updateDecision(closed.id, { lifecycle: "CLOSED" });
    const res = await GET();
    const body = await res.json();
    expect(body.cards.map((c: { id: string }) => c.id)).toEqual([active.id]);
    expect(body.actionableCount).toBe(1);
    expect(body.total).toBe(2); // closed 计入 total
    expect(body.checkInDueCount).toBe(0);
  });

  it("come_back_later 不获特殊优先级（只按 activity recency，§7/B3）", async () => {
    const { GET } = await import("./route");
    const user = await makeUser("wmn-cbl@example.com");
    asUser(user.id);
    const { create: createDecision } = await import(
      "@/lib/db/repositories/decision.repo"
    );
    // 先建 cbl（活动较早），再建 other 并 update（活动更近）
    const cbl = await createDecision(user.id, {
      question: "CBL",
      type: "not_sure",
    });
    await updateDecision(cbl.id, {
      decisionKind: "exploration",
      outcome: "come_back_later",
    });
    await tick();
    const other = await createDecision(user.id, {
      question: "Other",
      type: "not_sure",
    });
    await updateDecision(other.id, { topic: "fresh" }); // activity 更近
    const res = await GET();
    const body = await res.json();
    // activity 更近的 Other 排在 CBL 之前（cbl 不置顶）
    expect(body.cards[0].question).toBe("Other");
    expect(body.cards.map((c: { id: string }) => c.id)).toContain(cbl.id);
  });
});
