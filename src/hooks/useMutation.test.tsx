import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMutation } from "@/hooks/useMutation";
import { ApiError } from "@/lib/api";

describe("useMutation", () => {
  it("mutate success calls onSuccess and returns output", async () => {
    const onSuccess = vi.fn();
    const fn = vi.fn(async (x: number) => x + 1);
    const { result } = renderHook(() => useMutation(fn, { onSuccess }));
    let out: number | undefined;
    await act(async () => {
      out = await result.current.mutate(1);
    });
    expect(out).toBe(2);
    expect(onSuccess).toHaveBeenCalledWith(2);
    expect(result.current.error).toBeNull();
  });

  it("mutate failure sets error, returns undefined", async () => {
    const fn = vi.fn(async () => {
      throw new ApiError("bad", 400, "no");
    });
    const { result } = renderHook(() => useMutation(fn));
    let out: unknown;
    await act(async () => {
      out = await result.current.mutate(undefined as never);
    });
    expect(out).toBeUndefined();
    await waitFor(() => expect(result.current.error?.code).toBe("bad"));
  });

  it("reset clears error", async () => {
    const fn = vi.fn(async () => {
      throw new ApiError("bad", 400, "no");
    });
    const { result } = renderHook(() => useMutation(fn));
    await act(async () => {
      await result.current.mutate(undefined as never);
    });
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });
});
