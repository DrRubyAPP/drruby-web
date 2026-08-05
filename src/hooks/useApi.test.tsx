import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useApi } from "@/hooks/useApi";

vi.mock("@/lib/api", async (orig) => {
  const actual = await orig<typeof import("@/lib/api")>();
  return { ...actual, notifyUnauthorized: vi.fn() };
});

import { notifyUnauthorized } from "@/lib/api";

function okOnce(json: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(json),
          json: async () => json,
        }) as unknown as Response,
    ),
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("useApi", () => {
  it("loading → data on mount", async () => {
    okOnce([{ id: "s1" }]);
    const { result } = renderHook(() =>
      useApi<{ id: string }[]>("/api/signals"),
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: "s1" }]);
    expect(result.current.error).toBeNull();
  });

  it("error path sets error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 500,
            json: async () => ({
              error: { code: "internal_error", message: "boom" },
            }),
            text: async () => "",
          }) as unknown as Response,
      ),
    );
    const { result } = renderHook(() => useApi("/api/x"));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.status).toBe(500);
  });

  it("401 triggers notifyUnauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 401,
            json: async () => ({
              error: { code: "UNAUTHORIZED", message: "请先登录" },
            }),
            text: async () => "",
          }) as unknown as Response,
      ),
    );
    const { result } = renderHook(() => useApi("/api/me"));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(notifyUnauthorized).toHaveBeenCalled();
  });

  it("refetch re-runs", async () => {
    const fetchSpy = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () => "[]",
          json: async () => [],
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { result } = renderHook(() => useApi("/api/signals"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    result.current.refetch();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  it("does not setState after unmount", async () => {
    let resolve!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      ),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useApi("/api/slow"));
    unmount();
    resolve({
      ok: true,
      status: 200,
      text: async () => "{}",
      json: async () => ({}),
    });
    await Promise.resolve();
    expect(errSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("unmounted"),
    );
    errSpy.mockRestore();
  });
});
