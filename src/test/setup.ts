import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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
