# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

DrRuby website — a Next.js landing page for the DrRuby brand. Currently in early development; the scaffold was created with `create-next-app` and the initial goal is to replicate the landing page design in `a_docs/design/DrRuby_Landing_Combined.html`.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (uses Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking (`tsc --noEmit`) |

No test framework is configured yet.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Package manager**: pnpm
- **Fonts**: Geist Sans / Geist Mono (via `next/font/google`)

## Architecture

### Source Structure

```
src/
  app/            # Next.js App Router
    layout.tsx    # Root layout (Geist fonts, full-height flex body)
    page.tsx      # Home page
    globals.css   # Tailwind imports + CSS custom properties
    favicon.ico
public/           # Static assets (SVGs)
```

- Path alias: `@/*` → `./src/*`
- All components are **Server Components by default** — add `'use client'` only when interactivity (state, effects, event handlers) is required.

### App Router Conventions

- `page.tsx` = accessible route
- `layout.tsx` = shared UI that persists across navigations
- `loading.tsx` = Suspense fallback
- `error.tsx` = error boundary (must be a Client Component)
- `route.ts` = API endpoint (Route Handler)

### Styling

- Tailwind CSS v4 uses `@import "tailwindcss"` and `@theme inline {}` in `globals.css`
- Dark mode is supported via `prefers-color-scheme: dark` media query
- Custom CSS variables defined in `:root` (`--background`, `--foreground`) and mapped to Tailwind via `@theme inline`

## Design Reference

The landing page should replicate `a_docs/design/DrRuby_Landing_Combined.html`. This is the authoritative design source.

## Integrations

- **@mailchimp/mailchimp_marketing** — email marketing ✅ integrated
  - API route: `src/app/api/mailchimp/subscribe/route.ts`
  - Forms: `HomeCaptureForm` (home), `WaitlistForm` (skin/healthspan)
  - Env vars: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID`
  - Merge fields: `FNAME`, `PHONE`, `AGE`, `CONCERNS`, `SPEND`, `WINNING`
  - Tags: `home-page`, `skin-page`, `healthspan-page`

## Planned Integrations (not yet installed)

The `a_docs/notes-dev.md` lists these planned dependencies:
- **Prisma** + `@prisma/client` — database ORM
- **better-auth** — authentication
- **Stripe** (`stripe`, `@stripe/stripe-js`) — payments
- **shadcn/ui** — component library
- **react-hook-form** + **zod** — form handling & validation
- **lucide-react** + **@radix-ui/react-icons** — icons

## Project Docs

- `a_docs/design/` — Design references (HTML mockups)
- `a_docs/tech/` — Technical reference notes (App Router, data fetching, Mailchimp)
- `a_docs/prompts.md` — Current task prompt
- `temp/` — Temporary working files (Mailchimp email templates)

These directories are gitignored and are local working references only.
