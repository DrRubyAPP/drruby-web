import { config } from "dotenv";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Match the application's local-env precedence before selecting the test DB.
config({ path: ".env.local" });
config({ path: ".env" });

// Repository tests call deleteMany() for isolation. Never inherit the
// application's DATABASE_URL: require the dedicated test database instead.
const testingDatabaseUrl = process.env.TESTING_DATABASE_URL;
if (!testingDatabaseUrl) {
  throw new Error(
    "TESTING_DATABASE_URL is required for tests; refusing to use DATABASE_URL.",
  );
}
process.env.DATABASE_URL = testingDatabaseUrl;

// jsdom has no matchMedia; stub it so components relying on it don't crash.
if (!window.matchMedia) {
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
