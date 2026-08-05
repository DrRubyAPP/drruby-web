import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";

function spyFetch() {
  const spy = vi.fn(
    async (_path: string, _init?: RequestInit) =>
      ({
        ok: true,
        status: 200,
        text: async () => "{}",
        json: async () => ({}),
      }) as unknown as Response,
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}
afterEach(() => vi.unstubAllGlobals());

describe("apiClient", () => {
  it("get → method GET", async () => {
    const spy = spyFetch();
    await apiClient.get("/api/signals");
    expect(spy.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("post → JSON body + Content-Type", async () => {
    const spy = spyFetch();
    await apiClient.post("/api/decisions", { title: "x" });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "x" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("post without body → no body", async () => {
    const spy = spyFetch();
    await apiClient.post("/api/insights/refresh");
    expect((spy.mock.calls[0][1] as RequestInit).body).toBeUndefined();
  });
});
