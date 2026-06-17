# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

DrRuby website — a Next.js landing page for the DrRuby brand. Currently in early development; the scaffold was created with `create-next-app` and the initial goal is to replicate the landing page design in `a_docs/design/DrRuby_Landing_Combined.html`.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (uses Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Lint with Biome (`biome lint .`) |
| `pnpm format` | Format with Biome (`biome format --write .`) |
| `pnpm check` | Biome lint + format with autofix (`biome check --write .`) |
| `pnpm type-check` | Run TypeScript type checking (`tsc --noEmit`) |
| `pnpm test` | Run the test suite once (`vitest run`) |
| `pnpm test:watch` | Run tests in watch mode |

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 6.x (strict mode)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **i18n**: next-intl (no-routing single-locale mode, English)
- **Theming**: next-themes (class strategy: light / dark / system)
- **State / validation**: zustand, zod (installed; used as features need them)
- **Lint & format**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest + Testing Library (jsdom)
- **Package manager**: pnpm
- **Fonts**: Geist Sans / Geist Mono (via `next/font/google`)

## Architecture

### Source Structure (layer-based)

```
src/
  app/                       # Next.js App Router (routes, layout, API routes)
    layout.tsx               # Root layout: NextIntlClientProvider + ThemeProvider
    page.tsx, skin/, healthspan/
    globals.css              # Tailwind imports + theme tokens + .dark palette
    api/                     # Route handlers (health, mailchimp/subscribe)
  components/
    layout/                  # Navbar, Footer
    common/                  # PageSwitcher
    forms/                   # HomeCaptureForm, WaitlistForm
    theme/                   # ThemeProvider, ThemeToggle
  lib/                       # Framework-agnostic helpers (e.g. mailchimp.ts)
  config/                    # Site constants (site.ts: NAV_PAGES, locales)
  i18n/                      # next-intl: request.ts + messages/en.json
  hooks/  stores/  types/    # Placeholders for future hooks / zustand / shared types
  test/                      # Vitest setup (setup.ts)
public/                      # Static assets — MUST stay at repo root (Next.js requirement)
```

- Path alias: `@/*` → `./src/*`
- All components are **Server Components by default** — add `'use client'` only when interactivity (state, effects, event handlers) is required (`ThemeToggle`, `PageSwitcher`, the forms).
- API route handlers stay thin: parse the request and delegate to `lib/` (see `lib/mailchimp.ts`, which `api/mailchimp/subscribe/route.ts` calls).

### App Router Conventions

- `page.tsx` = accessible route
- `layout.tsx` = shared UI that persists across navigations
- `loading.tsx` = Suspense fallback
- `error.tsx` = error boundary (must be a Client Component)
- `route.ts` = API endpoint (Route Handler)

### Styling & theming

- Tailwind CSS v4 uses `@import "tailwindcss"` and `@theme inline {}` in `globals.css`. Biome does **not** touch `globals.css` (Tailwind owns its at-rules).
- Dark mode uses the **class strategy** (next-themes adds `.dark` to `<html>`), declared via `@custom-variant dark (&:where(.dark, .dark *))`.
- Semantic, theme-aware tokens drive surfaces and text so light/dark flip cleanly:
  - `--dr-fg` (primary text), `--dr-surface` (cards/inputs), `--dr-bg` (page) — overridden under `.dark`.
  - `--dr-black` stays dark in both themes (it backs the always-dark sections, e.g. `bg-dr-black`).
  - Brand colours (`--dr-red*`, greens, ambers) are intentionally not flipped.
- `ThemeProvider` wraps the app; `ThemeToggle` (mounted-guarded, no FOUC) lives in the Navbar.

### Internationalization (i18n)

- **next-intl** in no-routing single-locale mode (English, no `/en` prefix). Config: `src/i18n/request.ts`; copy: `src/i18n/messages/en.json` (namespaced).
- Server components: `const t = await getTranslations("ns")`. Client components: `const t = useTranslations("ns")`.
- Rich headings use `t.rich(key, { em, br, strong })`; arrays/objects use `t.raw(key)`.
- Add a language later by adding a message file and resolving the locale per request in `request.ts`.

### Testing

- Vitest + Testing Library (jsdom), `@/*` alias resolved via `vite-tsconfig-paths`. Setup in `src/test/setup.ts`. Co-locate tests as `*.test.ts(x)`.

## Design Reference

The landing page should replicate `a_docs/design/DrRuby_Landing_Combined.html`. This is the authoritative design source.

## Integrations

- **@mailchimp/mailchimp_marketing** — email marketing ✅ integrated
  - Logic: `src/lib/mailchimp.ts` (`subscribeMember`, plus `EMAIL_RE` / `TAG_MAP`)
  - API route: `src/app/api/mailchimp/subscribe/route.ts` (parses request → `subscribeMember`)
  - Forms: `components/forms/HomeCaptureForm` (home), `components/forms/WaitlistForm` (skin/healthspan)
  - Env vars (read at request time): `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID`
  - Merge fields: `FNAME`, `PHONE`, `AGE`, `CONCERNS`, `SPEND`, `WINNING`
  - Tags: `home-page`, `skin-page`, `healthspan-page`
- **zod** + **zustand** — ✅ installed (validation / client state); apply as features need them.

## Planned Integrations (not yet installed)

The `a_docs/notes-dev.md` lists these planned dependencies:
- **Prisma** + `@prisma/client` — database ORM
- **better-auth** — authentication
- **Stripe** (`stripe`, `@stripe/stripe-js`) — payments
- **shadcn/ui** — component library
- **react-hook-form** — form handling (pairs with the already-installed zod)
- **lucide-react** + **@radix-ui/react-icons** — icons

## Project Docs

- `a_docs/design/` — Design references (HTML mockups)
- `a_docs/tech/` — Technical reference notes (App Router, data fetching, Mailchimp)
- `a_docs/prompts.md` — Current task prompt
- `temp/` — Temporary working files (Mailchimp email templates)

These directories are gitignored and are local working references only.
