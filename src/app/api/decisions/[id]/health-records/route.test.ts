import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

async function seedDecisionAndRecord(userId: string) {
  const { decisionRepo, healthRecordRepo } = await import("@/lib/db");
  const decision = await decisionRepo.create(userId, {
    question: "Try Thermage?",
    goal: "firmness",
  });
  const record = await healthRecordRepo.create(userId, {
    kind: "lab",
    title: "lab for connect",
    status: "CONFIRMED",
    recordedAt: new Date(),
  });
  return { decision, record };
}

describe("GET/POST/DELETE /api/decisions/[id]/health-records", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("POST Connect 写入关联 + GET 返回 active 列表", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("conn-ok@example.com");
    asUser(user.id);
    const { decision, record } = await seedDecisionAndRecord(user.id);

    const postRes = await POST(
      jsonRequest({ healthRecordId: record.id }, { method: "POST" }),
      params(decision.id),
    );
    expect(postRes.status).toBe(201);

    const getRes = await GET(bareRequest("GET"), params(decision.id));
    const links: Array<{
      healthRecordId: string;
      healthRecord: { id: string };
    }> = await getRes.json();
    expect(links).toHaveLength(1);
    expect(links[0].healthRecordId).toBe(record.id);
    expect(links[0].healthRecord.id).toBe(record.id);
  });

  it("POST 越权 decision → 404（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const owner = await makeUser("conn-owner@example.com");
    const intruder = await makeUser("conn-intruder@example.com");
    asUser(owner.id);
    const { decision, record } = await seedDecisionAndRecord(owner.id);
    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ healthRecordId: record.id }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("POST 缺 healthRecordId → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("conn-bad@example.com");
    asUser(user.id);
    const { decision } = await seedDecisionAndRecord(user.id);
    const res = await POST(
      jsonRequest({}, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(400);
  });

  it("DELETE Disconnect 软删除 + GET 不再返回（C9 留痕）", async () => {
    const { POST, DELETE, GET } = await import("./route");
    const user = await makeUser("disc-ok@example.com");
    asUser(user.id);
    const { decision, record } = await seedDecisionAndRecord(user.id);

    await POST(
      jsonRequest({ healthRecordId: record.id }, { method: "POST" }),
      params(decision.id),
    );
    expect(
      await (await GET(bareRequest("GET"), params(decision.id))).json(),
    ).toHaveLength(1);

    // DELETE 通过 query 参数传 healthRecordId
    const url = `http://test/api/decisions/${decision.id}/health-records?healthRecordId=${record.id}`;
    const deleteRes = await DELETE(
      new Request(url, { method: "DELETE" }),
      params(decision.id),
    );
    expect(deleteRes.status).toBe(200);

    const links = await (
      await GET(bareRequest("GET"), params(decision.id))
    ).json();
    expect(links).toHaveLength(0); // removedAt=null 过滤
  });

  it("DELETE 缺 healthRecordId → 400", async () => {
    const { DELETE } = await import("./route");
    const user = await makeUser("disc-bad@example.com");
    asUser(user.id);
    const { decision } = await seedDecisionAndRecord(user.id);
    const res = await DELETE(bareRequest("DELETE"), params(decision.id));
    expect(res.status).toBe(400);
  });

  it("DELETE 越权 → 404", async () => {
    const { POST, DELETE } = await import("./route");
    const owner = await makeUser("disc-owner@example.com");
    const intruder = await makeUser("disc-intruder@example.com");
    asUser(owner.id);
    const { decision, record } = await seedDecisionAndRecord(owner.id);
    await POST(
      jsonRequest({ healthRecordId: record.id }, { method: "POST" }),
      params(decision.id),
    );
    asUser(intruder.id);
    const url = `http://test/api/decisions/${decision.id}/health-records?healthRecordId=${record.id}`;
    const res = await DELETE(
      new Request(url, { method: "DELETE" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("POST Connect 刷 Decision.lastUserActivityAt（§8 meaningful activity）", async () => {
    const { POST } = await import("./route");
    const { decisionRepo, healthRecordRepo, prisma } = await import("@/lib/db");
    const user = await makeUser("conn-act@example.com");
    asUser(user.id);
    const decision = await decisionRepo.create(user.id, {
      question: "q",
      goal: "firmness",
    });
    const record = await healthRecordRepo.create(user.id, {
      kind: "lab",
      title: "for activity",
      recordedAt: new Date(),
    });

    const before = await prisma.decision.findUniqueOrThrow({
      where: { id: decision.id },
    });
    await new Promise((r) => setTimeout(r, 10));
    await POST(
      jsonRequest({ healthRecordId: record.id }, { method: "POST" }),
      params(decision.id),
    );
    const after = await prisma.decision.findUniqueOrThrow({
      where: { id: decision.id },
    });
    expect(after.lastUserActivityAt.getTime()).toBeGreaterThan(
      before.lastUserActivityAt.getTime(),
    );
  });

  it("GET 列表按 connectedAt 倒序", async () => {
    const { POST, GET } = await import("./route");
    const user = await makeUser("conn-order@example.com");
    asUser(user.id);
    const { decision } = await seedDecisionAndRecord(user.id);
    const { healthRecordRepo } = await import("@/lib/db");
    const r1 = await healthRecordRepo.create(user.id, {
      kind: "lab",
      title: "r1",
      recordedAt: new Date(),
    });
    const r2 = await healthRecordRepo.create(user.id, {
      kind: "lab",
      title: "r2",
      recordedAt: new Date(),
    });

    await POST(
      jsonRequest({ healthRecordId: r1.id }, { method: "POST" }),
      params(decision.id),
    );
    await new Promise((r) => setTimeout(r, 10));
    await POST(
      jsonRequest({ healthRecordId: r2.id }, { method: "POST" }),
      params(decision.id),
    );

    const links = await (
      await GET(bareRequest("GET"), params(decision.id))
    ).json();
    expect(links).toHaveLength(2);
    expect(links[0].healthRecordId).toBe(r2.id); // 最新在前
    expect(links[1].healthRecordId).toBe(r1.id);
  });
});
