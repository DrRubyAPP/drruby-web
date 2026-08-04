import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signalRepo } from "@/lib/db";
import {
  asUser,
  disconnectDb,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

// 真实 DB + 真实规则/repo，只 mock 鉴权与 LLM（避免打真实上游网络）。
vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);
vi.mock("@/lib/llm/client", () => ({
  openAiClient: {
    isConfigured: () => false, // 降级规则原文，不触发网络润色
    chatComplete: async () => "",
  },
}));

describe("刷新 → 读端点抽查（真实 DB）", () => {
  beforeEach(async () => await resetDb());
  afterEach(async () => await disconnectDb());

  it("refresh 后 attention / aging-velocity 返回规则数值，DTO 校验通过", async () => {
    const user = await makeUser("insights-refresh@example.com");
    await signalRepo.create(user.id, {
      label: "雌激素",
      value: "42",
      unit: "pg/mL",
      source: "lab",
      confidence: "observed",
      trend: "down",
      measuredAt: new Date("2026-08-01"),
    });
    asUser(user.id);

    const { POST } = await import("./route");
    const refreshed = await POST();
    expect(refreshed.status).toBe(200);
    expect(await refreshed.json()).toEqual({ attention: 1, agingVelocity: 1 });

    const { GET: attentionGET } = await import("../attention/route");
    const attRes = await attentionGET();
    expect(attRes.status).toBe(200);
    const attention = await attRes.json();
    expect(attention).toHaveLength(1);
    expect(attention[0].accent).toBe("amber");
    expect(attention[0].tag).toBe("雌激素");

    const { GET: agingGET } = await import("../aging-velocity/route");
    const agingRes = await agingGET();
    expect(agingRes.status).toBe(200);
    const aging = await agingRes.json();
    expect(aging).toHaveLength(1);
    expect(aging[0].tone).toBe("amber");
    expect(aging[0].label).toBe("变化速度");
  });

  it("重复刷新不累积重复行（替换语义）", async () => {
    const user = await makeUser("insights-idempotent@example.com");
    await signalRepo.create(user.id, {
      label: "睡眠",
      value: "6.5",
      unit: "h",
      source: "wearable",
      confidence: "observed",
      trend: "down",
      measuredAt: new Date("2026-08-01"),
    });
    asUser(user.id);

    const { POST } = await import("./route");
    await POST();
    await POST();

    const { GET: attentionGET } = await import("../attention/route");
    const attention = await (await attentionGET()).json();
    expect(attention).toHaveLength(1); // 未累积
  });

  it("无数据用户：attention 返回 []，aging 返回 purple 兜底一条", async () => {
    const user = await makeUser("insights-empty@example.com");
    asUser(user.id);

    const { POST } = await import("./route");
    const res = await POST();
    expect(await res.json()).toEqual({ attention: 0, agingVelocity: 1 });

    const { GET: attentionGET } = await import("../attention/route");
    expect(await (await attentionGET()).json()).toEqual([]);

    const { GET: agingGET } = await import("../aging-velocity/route");
    const aging = await (await agingGET()).json();
    expect(aging).toHaveLength(1);
    expect(aging[0].tone).toBe("purple");
  });
});
