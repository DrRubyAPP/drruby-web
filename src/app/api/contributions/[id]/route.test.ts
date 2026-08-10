import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/contributions/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("shared true→false 撤回成功（可撤回）", async () => {
    const { POST } = await import("./route");
    const repo = await import("@/lib/db/repositories/contribution.repo");
    const user = await makeUser("contrib@example.com");
    const row = await repo.create(user.id, {
      title: "皮肤数据",
      description: "去标识化",
      shared: true,
    });

    asUser(user.id);
    const res = await POST(
      jsonRequest({ shared: false }, { method: "POST" }),
      params(row.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shared).toBe(false);

    // 撤回痕迹落库
    const after = await repo.findById(row.id);
    expect(after?.shared).toBe(false);
    expect(after?.withdrawnAt).not.toBeNull();

    // 可再次开启（true↔false 均可）
    const reshare = await POST(
      jsonRequest({ shared: true }, { method: "POST" }),
      params(row.id),
    );
    expect((await reshare.json()).shared).toBe(true);
  });

  it("越权切他人贡献 → 404", async () => {
    const { POST } = await import("./route");
    const repo = await import("@/lib/db/repositories/contribution.repo");
    const owner = await makeUser("contrib-owner@example.com");
    const intruder = await makeUser("contrib-intruder@example.com");
    const row = await repo.create(owner.id, {
      title: "x",
      description: "y",
    });

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ shared: true }, { method: "POST" }),
      params(row.id),
    );
    expect(res.status).toBe(404);
  });
});
