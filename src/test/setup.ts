import { config } from "dotenv";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// 对齐 Next.js / prisma.config.ts 的优先级：.env.local > .env
// （dotenv 不覆盖已设值；repo 测试的 DATABASE_URL 在 .env.local）
config({ path: ".env.local" });
config({ path: ".env" });

// jsdom has no matchMedia; stub it so components relying on it don't crash.
// `typeof window` guard lets node-environment tests (e.g. multipart route tests)
// reuse this setup file without a ReferenceError.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
