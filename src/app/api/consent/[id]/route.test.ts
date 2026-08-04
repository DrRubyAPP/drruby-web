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

describe("PATCH /api/consent/[id]", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("关闭 self（locked）档 → 409 且库未变", async () => {
    const { PATCH } = await import("./route");
    const consentRepo = await import(
      "@/lib/db/repositories/consentSetting.repo"
    );
    const user = await makeUser("consent-self@example.com");
    const setting = await consentRepo.upsert(user.id, {
      key: "self",
      title: "为自己",
      description: "永久开启",
      value: true,
      locked: true,
    });

    asUser(user.id);
    const res = await PATCH(
      jsonRequest({ value: false }, { method: "PATCH" }),
      params(setting.id),
    );
    expect(res.status).toBe(409);

    const still = await consentRepo.findById(setting.id);
    expect(still?.value).toBe(true);
  });

  it("切换可变档 → 成功", async () => {
    const { PATCH } = await import("./route");
    const consentRepo = await import(
      "@/lib/db/repositories/consentSetting.repo"
    );
    const user = await makeUser("consent-var@example.com");
    const setting = await consentRepo.upsert(user.id, {
      key: "deidentified_contribution",
      title: "去标识化贡献",
      description: "可切",
      value: false,
    });

    asUser(user.id);
    const res = await PATCH(
      jsonRequest({ value: true }, { method: "PATCH" }),
      params(setting.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.value).toBe(true);
  });

  it("越权切他人设置 → 404", async () => {
    const { PATCH } = await import("./route");
    const consentRepo = await import(
      "@/lib/db/repositories/consentSetting.repo"
    );
    const owner = await makeUser("consent-owner@example.com");
    const intruder = await makeUser("consent-intruder@example.com");
    const setting = await consentRepo.upsert(owner.id, {
      key: "identified_research",
      title: "具名研究",
      description: "可切",
      value: false,
    });

    asUser(intruder.id);
    const res = await PATCH(
      jsonRequest({ value: true }, { method: "PATCH" }),
      params(setting.id),
    );
    expect(res.status).toBe(404);
  });
});
