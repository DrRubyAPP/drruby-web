import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { toApiMessages, toErrorMessage } from "./coach-helpers";

describe("toApiMessages", () => {
  it("user → {role:'user'}, explain → {role:'assistant'}", () => {
    const out = toApiMessages([
      { type: "user", content: "hi" },
      { type: "explain", content: "hello back" },
    ]);
    expect(out).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello back" },
    ]);
  });

  it("过滤 typing/error/insight/system，仅保留 user/explain", () => {
    const out = toApiMessages([
      { type: "insight", content: "x" },
      { type: "user", content: "q" },
      { type: "system", content: "y" },
      { type: "explain", content: "a" },
      { type: "typing", content: "" },
      { type: "error", content: "" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].role).toBe("user");
    expect(out[1].role).toBe("assistant");
  });

  it("空数组返回空数组", () => {
    expect(toApiMessages([])).toEqual([]);
  });
});

describe("toErrorMessage", () => {
  const cases: Array<[string, number, string]> = [
    ["LLM_UNCONFIGURED", 503, "DrRuby 暂时无法响应，请稍后再试"],
    ["LLM_UPSTREAM", 502, "DrRuby 暂时无法响应，请稍后再试"],
    ["RATE_LIMITED", 429, "请求过于频繁，请稍后再试"],
    ["network_error", 0, "网络异常，请检查后重试"],
  ];
  for (const [code, status, expected] of cases) {
    it(`${code} → "${expected}"`, () => {
      expect(toErrorMessage(new ApiError(code, status, "内部细节不泄漏"))).toBe(
        expected,
      );
    });
  }

  it("未知 code + 5xx → 通用 5xx 文案", () => {
    expect(toErrorMessage(new ApiError("weird", 500, "x"))).toBe(
      "DrRuby 暂时无法响应，请稍后再试",
    );
  });

  it("未知 code + 4xx → 通用兜底文案", () => {
    expect(toErrorMessage(new ApiError("weird", 418, "x"))).toBe(
      "发生未知错误，请重试",
    );
  });
});
