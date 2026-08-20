# Project Summary

DrRuby.ai 官网——女性健康寿命（healthspan）智能平台。以皮肤为入口，连接身体其它变化。

包含四类页面：

- **公开落地页**：`/`（首页）、`/skin`、`/healthspan`、`/waitlist`
- **用户门户**：`/portal/*`（首页、appointments、clinic、coach、moment、products、profile、reports、settings、onboarding）
- **诊所门户**：`/clinic/*`（appointments、compliance、crm、finance、modules、patients、referrals、reports、settings、skin-archive、treatments）
- **API**：`/api/health`（健康检查）、`/api/mailchimp/subscribe`（订阅）

# Environment / Dependencies

- **Runtime**：Node.js ≥ 20（见 `package.json` `engines`）
- **包管理器**：pnpm（仓库根有 `pnpm-lock.yaml`、`pnpm-workspace.yaml`）
- **框架**：Next.js 16.2.7（App Router + Turbopack dev）、React 19.2.4
- **样式**：Tailwind CSS v4（通过 `@tailwindcss/postcss`，无 `tailwind.config.ts`，纯 CSS `@theme inline`）
- **国际化**：next-intl v4（当前仅 `en`，no-routing 模式，无 URL 前缀）
- **主题**：next-themes v0.4（`attribute="class"`，`defaultTheme="light"`，`enableSystem={false}`）
- **状态**：Zustand v5
- **校验**：Zod v4
- **数据库**：PostgreSQL 16 + Prisma ORM v6（`prisma-client-js` generator，schema 在 `prisma/schema.prisma`）
- **邮件营销**：`@mailchimp/mailchimp_marketing`
- **代码质量**：Biome 2.5（lint + format）、TypeScript 6（`strict: true`）
- **测试**：Vitest 4 + @testing-library/react + jsdom
- **部署**：`next.config.ts` 中 `output: "standalone"`

## 必需环境变量

Mailchimp 相关（仅服务端，参见 `src/lib/mailchimp.ts`）：

- `MAILCHIMP_API_KEY`
- `MAILCHIMP_SERVER_PREFIX`
- `MAILCHIMP_AUDIENCE_ID`

缺失时 `/api/health` 返回 503，订阅接口返回 503。

数据库相关（参见 `src/lib/db/prisma.ts`、`prisma/schema.prisma`）：

- `DATABASE_URL`：PostgreSQL 连接串（本地：`postgresql://drruby:drruby@localhost:5433/drruby?schema=public`）

缺失时 PrismaClient 查询会抛连接错误。本地起库：`docker compose up -d`。

# Commands

```bash
pnpm dev          # 启动 dev server（Turbopack），http://localhost:3000
pnpm build        # 生产构建（standalone 输出）
pnpm start        # 运行构建产物

pnpm lint         # Biome lint
pnpm format       # Biome 格式化（写盘）
pnpm check        # Biome check --write（lint + format 一起）
pnpm type-check   # tsc --noEmit

pnpm test         # vitest run（单次）
pnpm test:watch   # vitest watch

pnpm db:migrate:dev    # 创建/应用迁移（开发，需 Docker Postgres 运行）
pnpm db:migrate:deploy # 应用已有迁移（生产）
pnpm db:migrate:status # 查看迁移状态
pnpm db:generate       # 重新生成 Prisma Client
pnpm db:studio         # Prisma Studio GUI
pnpm db:push           # schema → DB 直接推送（不走迁移，慎用）
```

# Code Spec

## 路径别名

- `@/*` → `./src/*`（见 `tsconfig.json` `paths`）。import 一律用 `@/` 前缀，不要相对路径穿越 `../`。

## Biome 规则（`biome.json`）

- `indentStyle: space`，`indentWidth: 2`
- `quoteStyle: double`（JS/TS 字符串）
- Linter `preset: "none"`——默认不开规则，按需在 `rules` 下增量开启
- `src/app/globals.css` 已从 Biome 检查中排除，不要在此文件外用 Biome 处理它
- VCS 集成已启用，遵循 `.gitignore`

## TypeScript

- `strict: true`，`noEmit: true`（类型检查走 `pnpm type-check`）
- `moduleResolution: "bundler"`，`jsx: "react-jsx"`
- `target: "ES2017"`

## React / Next 约定

- App Router：页面放 `src/app/**/page.tsx`，布局 `layout.tsx`，路由处理器 `route.ts`
- 客户端组件必须顶部 `"use client"`
- 异步服务端组件用 `async function`，`getLocale`/`getTranslations` 等 next-intl server API 直接 await
- 不引入新的 CSS-in-JS 或 Tailwind 以外的样式方案；颜色用 `globals.css` 中的 `--dr-*` 变量经 `@theme inline` 暴露的 `bg-dr-*` / `text-dr-*` 工具类

## 主题（重要）

`src/components/theme/ThemeProvider.tsx` 中 next-themes 配置**不可**改为 `defaultTheme="system"` 或 `enableSystem={true}`。`globals.css` 里 `.dark` 会把 `--dr-off`（页面主背景）从米色 `#f8f7f5` 改成近黑 `#161616`，clinic/* 和 portal/* 的根容器依赖 `bg-dr-off`，开启 system 主题会让暗色系统用户看到"背景丢失"。如需支持暗色模式，先审视所有 `bg-dr-off`、`bg-dr-white`、`text-dr-ink` 在暗色下的可读性。

## 国际化

- 文案放 `src/i18n/messages/en.json`，按命名空间组织（如 `nav`、`home`、`skin`）
- `src/i18n/request.ts` 是 next-intl 入口，目前硬编码 `DEFAULT_LOCALE="en"`；新增语言时改这里
- 文档化的导航项见 `src/config/site.ts` 的 `NAV_PAGES`，`labelKey` 对应 `nav` 命名空间

## 测试

- Vitest 配置：`vitest.config.ts`，环境 `jsdom`，setup 文件 `src/test/setup.ts`
- 测试文件与被测文件同目录，命名 `*.test.ts(x)`
- repository 测试（`src/lib/db/repositories/*.test.ts`）连真实 DB，`fileParallelism: false` 避免并行冲突
- 参考 `src/lib/mailchimp.test.ts`、`src/lib/db/repositories/userAccount.repo.test.ts`

## 数据库（Prisma）

- Schema：`prisma/schema.prisma`，24 张消费者数据表（参考 `a_docs/drruby-docs/mvp2/data-model-2.md`）
- 命名：model PascalCase、字段 camelCase，`@map`/`@@map` 映射到 snake_case 表名列名
- 主键：普通实体表 `id String @id @default(cuid(2))`；`glucose_stream` 用 `BigInt @default(autoincrement())`
- 枚举：一律 `String` + Zod 校验（`src/lib/db/enums.ts`），不使用 Prisma enum / Postgres 原生 ENUM
- 迁移：`prisma/migrations/`，以 `prisma migrate dev` 为唯一真相源，**禁止 `prisma db pull` 覆盖 schema**（partial unique index 等 raw SQL 约束会丢失）
- raw SQL 约束：`lower(email)` 唯一索引、`study_session` partial unique、`image_info` CHECK 在迁移 `20260624165538_add_raw_sql_constraints` 中
- pgvector：`expert_source.embedding_ref` 本地暂用 `text`（Docker Hub 不可达未装 pgvector），生产切 `pgvector/pgvector:pg16` 镜像后 ALTER 为 `vector(1536)` + 建向量索引
- 单例：`src/lib/db/prisma.ts` 导出 `prisma`（dev 挂 `globalThis` 避免 HMR 多实例）
- repository 层：`src/lib/db/repositories/`，当前覆盖 6 张高频表（userAccount/userBaseline/studySession/imageInfo/sisHistory/interventionLog），写入前用 Zod 校验枚举
- 软删除：`user_account` / `study_session` 带 `deletedAt`，Prisma 不自动过滤，调用方需显式 `where: { deletedAt: null }`

# Architecture

## 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 根布局：字体 + NextIntlClientProvider + ThemeProvider
│   ├── page.tsx              # 首页
│   ├── globals.css           # Tailwind 入口 + :root/.dark 变量 + @theme inline
│   ├── skin/ healthspan/ waitlist/   # 公开落地页
│   ├── portal/               # 用户门户（含 onboarding）
│   ├── clinic/               # 诊所门户
│   ├── api/
│   │   ├── health/route.ts          # 健康检查（Mailchimp env 是否就绪）
│   │   └── mailchimp/subscribe/route.ts  # 订阅接口，转发到 src/lib/mailchimp.ts
│   └── onboarding/ waitlist/
├── components/
│   ├── layout/               # Navbar / Footer / PortalShell / ClinicShell 及对应 Topbar/Sidebar
│   ├── sections/             # 按页面分组的区块：home/ skin/ healthspan/ waitlist/ portal/
│   ├── forms/                # HomeCaptureForm / WaitlistForm
│   ├── common/               # 通用小组件（PortalCard、MedicalDisclaimer 等）
│   └── theme/                # ThemeProvider
├── config/                   # site.ts（NAV_PAGES、LOCALES）+ 各门户 mock 数据
├── i18n/                     # request.ts + messages/en.json
├── lib/                      # 业务库
│   ├── mailchimp.ts          # Mailchimp 订阅
│   └── db/                   # Prisma + repository 层
│       ├── prisma.ts         # PrismaClient 单例
│       ├── enums.ts          # 枚举 Zod schema
│       ├── index.ts          # 汇总 re-export
│       └── repositories/     # 6 张高频表 repo（userAccount/userBaseline/studySession/imageInfo/sisHistory/interventionLog）
├── stores/                   # Zustand stores（按需新增）
├── hooks/                    # 自定义 hooks（按需新增）
├── test/                     # vitest setup
└── types/                    # 全局类型定义
```

## 请求流：订阅表单

1. 公开页表单组件（`HomeCaptureForm` / `WaitlistForm`）收集 email + 可选字段
2. POST `/api/mailchimp/subscribe` → `src/app/api/mailchimp/subscribe/route.ts`
3. 调用 `subscribeMember(input)`（`src/lib/mailchimp.ts`）：
   - 校验 email（`EMAIL_RE`）
   - 按 md5(email) 查 Mailchimp list member；存在则更新 merge fields，已退订则重订阅
   - 不存在则新增，按 `formId` 映射到 tag（`home-page` / `skin-page` / `healthspan-page`）
4. 返回 `{ ok, message }` 或 `{ error }`，HTTP 状态码透传

## 主题与样式系统

- `globals.css` 在 `:root` 定义 `--dr-*` 品牌色 + 语义 token（`--dr-bg` / `--dr-surface` / `--dr-fg`）
- `.dark` 只覆盖背景/边框类 token，品牌色（`--dr-red`、success/warn/alert、insight 系列）不变
- Tailwind 通过 `@theme inline` 把 `--dr-*` 映射成 `dr-*` 工具类（如 `bg-dr-off`、`text-dr-ink`）
- 字体：Cormorant Garamond（serif，`--font-serif`）+ Jost（sans，`--font-sans`），由 `next/font` 注入

## 门户 Shell

- `PortalShell` / `ClinicShell` 各自配对 `Topbar` + `Sidebar`，作为对应门户页面的外层布局
- 门户页面通常为客户端组件，依赖 `bg-dr-off` 等浅色 token——见上文"主题"约束

## 部署

- `pnpm build` 产出 standalone 包（`.next/standalone` + `.next/static`）
- `postinstall` 钩子自动跑 `prisma generate`，确保 Railway 部署时 Prisma Client 就绪
- 运行时需 Node 环境 + Mailchimp 环境变量 + `DATABASE_URL`
- 生产迁移：`pnpm db:migrate:deploy`（Railway release phase 或部署脚本）
- `/api/health` 可作部署后健康探针

## 发布流程（重要）

版本发布为**纯手动流程**，不引入自动化工具，不打 git tag，不建 GitHub Release。
每次发布由发布人手动改 `package.json` 的 `version` 并手写 `CHANGELOG.md`。

完整步骤、版本号 bump 决策参考（SemVer）、CHANGELOG 分类规范见 **`RELEASING.md`**。
要点：发布从 `dev` 分支切出；提交信息用 `chore(release): vx.y.z`。
