import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { AppError, handle } from "@/lib/errors";
import { err, ok } from "@/lib/result";

// Silence logging during the handle() tests.
vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("AppError", () => {
  it("carries code, status and message", () => {
    const e = new AppError("not_found", "Missing", 404);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("not_found");
    expect(e.status).toBe(404);
    expect(e.message).toBe("Missing");
  });

  it("defaults status to 400 and preserves cause", () => {
    const cause = new Error("root");
    const e = new AppError("bad", "Bad", undefined, { cause });
    expect(e.status).toBe(400);
    expect(e.cause).toBe(cause);
  });

  it("carries optional headers (e.g. Retry-After for 429)", () => {
    const e = new AppError("rate_limited", "请求过于频繁", 429, {
      headers: { "Retry-After": "3" },
    });
    expect(e.headers).toEqual({ "Retry-After": "3" });
  });

  it("defaults headers to undefined when not provided", () => {
    const e = new AppError("bad", "Bad", 400);
    expect(e.headers).toBeUndefined();
  });
});

describe("Result", () => {
  it("ok/err build a discriminated union", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
    const e = new AppError("x", "y");
    expect(err(e)).toEqual({ ok: false, error: e });
  });
});

describe("handle", () => {
  it("passes through the response on success", async () => {
    const wrapped = handle(async () => NextResponse.json({ hi: 1 }));
    const res = await wrapped();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hi: 1 });
  });

  it("maps an AppError to its status and safe body", async () => {
    const wrapped = handle(async () => {
      throw new AppError("bad_input", "Nope", 422);
    });
    const res = await wrapped();
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: { code: "bad_input", message: "Nope" },
    });
  });

  it("persists AppError headers onto the response (e.g. Retry-After)", async () => {
    const wrapped = handle(async () => {
      throw new AppError("rate_limited", "请求过于频繁", 429, {
        headers: { "Retry-After": "3" },
      });
    });
    const res = await wrapped();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3");
    expect(await res.json()).toEqual({
      error: { code: "rate_limited", message: "请求过于频繁" },
    });
  });

  it("does not set headers on response when AppError has none", async () => {
    const wrapped = handle(async () => {
      throw new AppError("bad_input", "Nope", 422);
    });
    const res = await wrapped();
    expect(res.headers.has("Retry-After")).toBe(false);
  });

  it("maps unknown errors to 500 without leaking internals", async () => {
    const wrapped = handle(async () => {
      throw new Error("secret internal detail");
    });
    const res = await wrapped();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal_error");
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
  });
});
