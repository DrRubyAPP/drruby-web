// Empty stub aliased in place of `server-only` / `client-only` during tests.
// Those packages throw on import outside the Next.js RSC/bundler environment;
// under Vitest we swap them for this no-op so server modules stay importable.
export {};
