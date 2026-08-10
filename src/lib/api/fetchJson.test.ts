import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { fetchJson } from "@/lib/api/fetchJson";

// 模拟 bearer token 存储：默认无 token；具体用例再设定返回值。
const getBearerToken = vi.fn(() => null as string | null);
const clearBearerToken = vi.fn();
vi.mock("@/lib/auth/token", () => ({
  getBearerToken: () => getBearerToken(),
  setBearerToken: vi.fn(),
  clearBearerToken: () => clearBearerToken(),
}));

function mockFetch(
  res: Partial<Response> & { _json?: unknown; _text?: string },
) {
  const impl = {
    ok: res.ok ?? true,
    status: res.status ?? 200,
    json: async () => {
      if (res._json === undefined) throw new SyntaxError("not json");
      return res._json;
    },
    text: async () =>
      res._text ?? (res._json !== undefined ? JSON.stringify(res._json) : ""),
  } as unknown as Response;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => impl),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchJson", () => {
  it("2xx returns parsed data", async () => {
    mockFetch({ ok: true, status: 200, _json: [{ id: "s1" }] });
    await expect(fetchJson("/api/signals")).resolves.toEqual([{ id: "s1" }]);
  });

  it("sends credentials + Accept, same-origin path", async () => {
    const spy = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () => "{}",
          json: async () => ({}),
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", spy);
    await fetchJson("/api/me");
    expect(spy).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
  });

  it("attaches Authorization: Bearer when a token is stored (API 禁 cookie 通道)", async () => {
    getBearerToken.mockReturnValue("tok-abc");
    const spy = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () => "{}",
          json: async () => ({}),
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", spy);
    await fetchJson("/api/me");
    expect(spy).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok-abc",
        }),
      }),
    );
  });

  it("clears stored token on 401 (session 过期 → 重登闭环)", async () => {
    getBearerToken.mockReturnValue("tok-abc");
    clearBearerToken.mockClear();
    mockFetch({
      ok: false,
      status: 401,
      _json: { error: { code: "UNAUTHORIZED", message: "请先登录" } },
    });
    await expect(fetchJson("/api/me")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(clearBearerToken).toHaveBeenCalled();
  });

  it("4xx with error body → ApiError(code,status,message,issues)", async () => {
    mockFetch({
      ok: false,
      status: 400,
      _json: {
        error: {
          code: "validation_error",
          message: "参数不合法",
          issues: [{ path: ["x"] }],
        },
      },
    });
    await expect(fetchJson("/api/x")).rejects.toMatchObject({
      code: "validation_error",
      status: 400,
      message: "参数不合法",
      issues: [{ path: ["x"] }],
    });
  });

  it("401 → ApiError(status=401), does not navigate", async () => {
    mockFetch({
      ok: false,
      status: 401,
      _json: { error: { code: "UNAUTHORIZED", message: "请先登录" } },
    });
    await expect(fetchJson("/api/me")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("5xx non-JSON (HTML error page) → http_error fallback", async () => {
    mockFetch({ ok: false, status: 502, _text: "<html>bad gateway</html>" });
    await expect(fetchJson("/api/x")).rejects.toMatchObject({
      code: "http_error",
      status: 502,
    });
  });

  it("network error → ApiError(network_error, 0)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(fetchJson("/api/x")).rejects.toMatchObject({
      code: "network_error",
      status: 0,
    });
  });

  it("204 → null", async () => {
    mockFetch({ ok: true, status: 204, _text: "" });
    await expect(fetchJson("/api/x")).resolves.toBeNull();
  });

  it("empty 2xx body → null", async () => {
    mockFetch({ ok: true, status: 200, _text: "" });
    await expect(fetchJson("/api/x")).resolves.toBeNull();
  });

  it("2xx non-JSON body → invalid_json", async () => {
    mockFetch({ ok: true, status: 200, _text: "not-json" });
    await expect(fetchJson("/api/x")).rejects.toBeInstanceOf(ApiError);
    await expect(fetchJson("/api/x")).rejects.toMatchObject({
      code: "invalid_json",
    });
  });
});
