import { describe, expect, it } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  it("exposes the standard pino methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.child).toBe("function");
  });

  it("takes its level from LOG_LEVEL (default info)", () => {
    expect(logger.level).toBe(process.env.LOG_LEVEL ?? "info");
  });

  it("child() returns a logger with the same interface", () => {
    const child = logger.child({ scope: "test" });
    expect(typeof child.info).toBe("function");
  });
});
