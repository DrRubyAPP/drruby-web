import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";

describe("ApiError", () => {
  it("carries code, status, message, issues", () => {
    const e = new ApiError("validation_error", 400, "参数不合法", [
      { path: ["x"] },
    ]);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
    expect(e.code).toBe("validation_error");
    expect(e.status).toBe(400);
    expect(e.message).toBe("参数不合法");
    expect(e.issues).toEqual([{ path: ["x"] }]);
  });

  it("issues optional", () => {
    const e = new ApiError("network_error", 0, "网络异常");
    expect(e.issues).toBeUndefined();
  });
});
