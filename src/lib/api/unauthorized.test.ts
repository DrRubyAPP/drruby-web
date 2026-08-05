import { describe, expect, it, vi } from "vitest";
import { notifyUnauthorized, onUnauthorized } from "@/lib/api/unauthorized";

describe("unauthorized registry", () => {
  it("invokes the registered handler", () => {
    const fn = vi.fn();
    onUnauthorized(fn);
    notifyUnauthorized();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops future notifications", () => {
    const fn = vi.fn();
    const off = onUnauthorized(fn);
    off();
    notifyUnauthorized();
    expect(fn).not.toHaveBeenCalled();
  });

  it("latest registration wins", () => {
    const a = vi.fn();
    const b = vi.fn();
    onUnauthorized(a);
    onUnauthorized(b);
    notifyUnauthorized();
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});
