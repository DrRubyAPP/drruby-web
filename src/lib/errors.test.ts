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
