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

## [0.3.0] - 2026-09-01

Second feature release: decision lifecycle, What Matters Now, and the One Loop
observe-learn cycle (task-37 ~ task-44).

### Added

- **Decision lifecycle model** (task-37/39): `lifecycle`/`decisionKind`/`outcome`
  三维数据模型（全仓从 `status` 迁移），topic/topicSlug 拆分与按主题语料库，
  idempotent create、reopen / check-freshness / complete 端点与 422 outcome guard，
  `decision.saved` + `yourselfContext`。
- **What Matters Now** (task-40): `GET /api/decisions/wmn` 输出 P1/P2/P3 排序、去重、
  ≤3 卡片 + 三态计数；Home 三态呈现与导航降级。
- **One Loop: Observe & Learn** (task-44): observe start/stop、learn、complete 端点；
  Observation 表单 UI（4 态 direction、编辑模式）、Stop Observing 按钮、Learning
  summary 表单；`nextCheckInAt`/`observeBaseline`/`direction` 字段与 P1 真实
  check-in 查询。
- **Health records & AI state** (task-43): HealthSource/Record/Revision/
  DecisionHealthRecord 模型与 repo；snapshot / health-context / regenerate /
  ai-state 端点；HealthContextQuestionnaire（5 类预填 + §20/§21 确认门）；
  Connect / Correct / remove-with-trail；AiStateView（5 态）。
- **Regeneration pipeline**: RegenerationOrchestrator（connect→pending→lazy
  fire→material→synthesize→snapshot）、RelevanceEngine、MaterialDetector、
  Synthesizer（template + LLM fallback）。
- **Journeys**: journey 读端点 + seed 数据；Library 对接真实 API 与匿名贡献
  对话（`POST /api/contributions`）。
- DecisionDetailView 三视角（Current/History/HealthContext/AiState）+ Decide gate。
- Notification preferences 与 `/api/me` 扩展资料更新。
- `NEXT_PUBLIC_HIDE_HOME_LOGIN` 开关（屏蔽公开页登录入口）。
- railway-db 管理脚本；seed 增加 clinic 账号与 lifecycle 模型数据。

### Changed

- 用户门户 UI 重构（task-plan-0824）：skin/healthspan 迁入 portal，导航对齐
  持久层（My Body → My Health），侧边栏中深灰，flows 页面 back-link topbar，
  Moment 旧语法彻底重命名。
- Goal 接入 Decision（数据模型 + 创建流）。
- openapi.json 重新生成（task-35 端点、decision goal/topic 字段）。

### Fixed

- 首页左上角 logo 与标题。
- `NEXT_PUBLIC_ENABLE_LOCALE_SWITCH` 不生效。
- portal.css import 层级问题（health review page）。
- ask-flow 测试、proxy mock 与 zh key parity。

### Removed

- Forum 残留与 legacy portal 路由、孤儿组件。

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
