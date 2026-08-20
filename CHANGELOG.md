# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-

### Changed

-

### Fixed

-

### Removed

-

### Dependencies

-

## [0.2.0] - 2026-08-20

First feature release cut from `dev`, building on the `0.1.0` baseline.

### Added

- **User portal wired to real APIs**: Profile identity (inline name edit), Account summary,
  Settings (account/export/delete islands), Reports (list/detail/add dialogs), CoachChat
  (`POST /api/ask` with typing/error bubbles), Moment + Decisions (View + drawers +
  `SaveAsDecisionButton`), Ask DrRuby modal, Timeline, dynamic user info from `/api/me`,
  and "Coming soon" placeholders replacing mock numbers.
- **Admin console**: `/admin` route with `AdminShell` + role guard, users list/detail/edit
  client islands (search/pagination), `userAccount.repo.list` with pagination/search,
  `db:seed:admin` bootstrap script, and admin i18n namespace.
- **Clinic portal domains**: appointments / patients / skin-archive, finance / referrals /
  reports-queue, treatments / crm / compliance, plus clinic API infrastructure.
- **AI reports**: `ai_report` table + enums, repository with pagination, generate/list/detail
  endpoints, and a rule-based draft + LLM-polish generation service.
- **Insights**: rule + LLM generation with `POST /api/insights/refresh`.
- **Ask DrRuby**: `POST /api/ask` guarded LLM proxy with history injection and rate limiting.
- **LLM client**: OpenAI-compatible client (mockable) with upstream usage parsing.
- **Rate limiting**: token-bucket guards for auth (`/ask`), `insights/refresh`, and `me/export`
  (6 req/min).
- **Auth hardening**: API auth restricted to Bearer token (cookie disabled for web sync);
  partition-level role guards (`clinic`/`portal`/admin); middleware protects
  `/collaborate/workspace`.
- **API client foundation**: `fetchJson`/`apiClient`/`ApiError` + 401 registry, and
  `useApi`/`useMutation` hooks.
- **i18n**: portal dashboard copy extracted to `en`/`zh`; `AppError` now supports a `headers` field.

### Changed

- HTTP methods restricted to GET/POST only.
- OpenAPI spec (`openapi.json`) generated and wired into build/prebuild.

### Dependencies

- Added `better-auth` (authentication), `resend` (email), and `pino` (logging).

## [0.1.0] - 2026-08-20

Initial baseline of the DrRuby.ai website.

### Added

- Public landing pages: `/` (home), `/skin`, `/healthspan`, `/waitlist`.
- User portal (`/portal/*`): home, appointments, clinic, coach, moment, products, profile, reports, settings, onboarding.
- Clinic portal (`/clinic/*`): appointments, compliance, crm, finance, modules, patients, referrals, reports, settings, skin-archive, treatments.
- API: `/api/health` (health check) and `/api/mailchimp/subscribe` (Mailchimp subscription).
- Data layer: Prisma + PostgreSQL schema and repository layer for high-frequency tables.
- Theming via `next-themes` and `Tailwind CSS v4` with brand `--dr-*` tokens; internationalization via `next-intl` (en).
