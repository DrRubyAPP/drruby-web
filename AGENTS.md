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
- 参考 `src/lib/mailchimp.test.ts`

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
├── lib/                      # 业务库（当前：mailchimp.ts + 测试）
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
- 运行时仅需 Node 环境 + 上述 Mailchimp 环境变量
- `/api/health` 可作部署后健康探针
